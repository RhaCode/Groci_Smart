"""
Views for shopping_lists app
backend/shopping_lists/views.py
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import ShoppingList, ShoppingListItem
from .serializers import (
    ShoppingListSerializer,
    ShoppingListListSerializer,
    ShoppingListCreateSerializer,
    ShoppingListUpdateSerializer,
    ShoppingListItemSerializer,
    ShoppingListItemCreateSerializer,
    ShoppingListItemUpdateSerializer,
    AddItemsToListSerializer,
    GenerateListFromReceiptSerializer,
    ListPriceComparisonSerializer,
    ReorderItemsSerializer
)
from receipts.models import Receipt
from products.models import Product, PriceHistory


# ===================== SHOPPING LIST VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_shopping_lists(request):
    """Get all shopping lists for current user"""
    lists = ShoppingList.objects.filter(user=request.user).prefetch_related('items')
    
    # Apply status filter
    status_filter = request.query_params.get('status')
    if status_filter:
        lists = lists.filter(status=status_filter)
    
    # Pagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(lists, request)
    serializer = ShoppingListListSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_shopping_list_detail(request, list_id):
    """Get detailed information about a shopping list"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    serializer = ShoppingListSerializer(shopping_list)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_shopping_list(request):
    """Create a new shopping list"""
    serializer = ShoppingListCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        shopping_list = serializer.save()
        return Response(
            ShoppingListSerializer(shopping_list).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_shopping_list(request, list_id):
    """Update shopping list information"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    serializer = ShoppingListUpdateSerializer(shopping_list, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(ShoppingListSerializer(shopping_list).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_shopping_list(request, list_id):
    """Delete a shopping list"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    shopping_list.delete()
    return Response({'message': 'Shopping list deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def duplicate_shopping_list(request, list_id):
    """Duplicate a shopping list"""
    original_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    
    # Create new list
    new_list = ShoppingList.objects.create(
        user=request.user,
        name=f"{original_list.name} (Copy)",
        status='active',
        notes=original_list.notes
    )
    
    # Copy all items
    for item in original_list.items.all():
        ShoppingListItem.objects.create(
            shopping_list=new_list,
            product=item.product,
            product_name=item.product_name,
            quantity=item.quantity,
            unit=item.unit,
            estimated_price=item.estimated_price,
            notes=item.notes,
            position=item.position
        )
    
    # Calculate estimated total
    new_list.calculate_estimated_total()
    
    return Response(
        ShoppingListSerializer(new_list).data,
        status=status.HTTP_201_CREATED
    )


# ===================== SHOPPING LIST ITEM VIEWS =====================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_list_item(request, list_id, item_id):
    """Get a single shopping list item by ID"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    item = get_object_or_404(ShoppingListItem, id=item_id, shopping_list=shopping_list)
    
    serializer = ShoppingListItemSerializer(item)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_list_items(request, list_id):
    """Get all items for a shopping list"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    items = shopping_list.items.all()
    
    # Filter by checked status if provided
    is_checked = request.query_params.get('is_checked')
    if is_checked is not None:
        items = items.filter(is_checked=is_checked.lower() == 'true')
    
    serializer = ShoppingListItemSerializer(items, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_list_item(request, list_id):
    """Add a single item to a shopping list"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    
    serializer = ShoppingListItemCreateSerializer(data=request.data)
    if serializer.is_valid():
        item = serializer.save(shopping_list=shopping_list)
        
        # Update estimated total
        shopping_list.calculate_estimated_total()
        
        return Response(
            ShoppingListItemSerializer(item).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_list_items_bulk(request, list_id):
    """Add multiple items to a shopping list"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    
    serializer = AddItemsToListSerializer(data=request.data)
    if serializer.is_valid():
        items_data = serializer.validated_data['items']
        created_items = []
        
        for item_data in items_data:
            item = ShoppingListItem.objects.create(
                shopping_list=shopping_list,
                **item_data
            )
            created_items.append(item)
        
        # Update estimated total
        shopping_list.calculate_estimated_total()
        
        return Response(
            ShoppingListItemSerializer(created_items, many=True).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_list_item(request, list_id, item_id):
    """Update a shopping list item"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    item = get_object_or_404(ShoppingListItem, id=item_id, shopping_list=shopping_list)
    
    serializer = ShoppingListItemUpdateSerializer(item, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        
        # Update estimated total if price or quantity changed
        if 'estimated_price' in request.data or 'quantity' in request.data:
            shopping_list.calculate_estimated_total()
        
        return Response(ShoppingListItemSerializer(item).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_list_item(request, list_id, item_id):
    """Delete a shopping list item"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    item = get_object_or_404(ShoppingListItem, id=item_id, shopping_list=shopping_list)
    
    item.delete()
    
    # Update estimated total
    shopping_list.calculate_estimated_total()
    
    return Response({'message': 'Item deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_item_checked(request, list_id, item_id):
    """Toggle item checked status"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    item = get_object_or_404(ShoppingListItem, id=item_id, shopping_list=shopping_list)
    
    item.is_checked = not item.is_checked
    item.save()
    
    return Response(ShoppingListItemSerializer(item).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def clear_checked_items(request, list_id):
    """Remove all checked items from a list"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    
    deleted_count = shopping_list.items.filter(is_checked=True).delete()[0]
    
    # Update estimated total
    shopping_list.calculate_estimated_total()
    
    return Response({
        'message': f'{deleted_count} items removed successfully',
        'deleted_count': deleted_count
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reorder_items(request, list_id):
    """Reorder items in a shopping list"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    
    serializer = ReorderItemsSerializer(data=request.data)
    if serializer.is_valid():
        item_orders = serializer.validated_data['item_orders']
        
        for order in item_orders:
            item_id = order['item_id']
            position = order['position']
            
            try:
                item = shopping_list.items.get(id=item_id)
                item.position = position
                item.save()
            except ShoppingListItem.DoesNotExist:
                continue
        
        return Response({'message': 'Items reordered successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===================== SPECIAL FEATURES =====================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_list_from_receipt(request):
    """Generate shopping list from a receipt"""
    serializer = GenerateListFromReceiptSerializer(
        data=request.data, 
        context={'request': request}
    )
    if serializer.is_valid():
        receipt_id = serializer.validated_data['receipt_id']
        list_name = serializer.validated_data.get('list_name', 'Shopping List from Receipt')
        
        receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
        
        # Create new shopping list
        shopping_list = ShoppingList.objects.create(
            user=request.user,
            name=list_name,
            status='active'
        )
        
        # Add items from receipt
        for receipt_item in receipt.items.all():
            ShoppingListItem.objects.create(
                shopping_list=shopping_list,
                product=receipt_item.product,
                product_name=receipt_item.product_name,
                quantity=receipt_item.quantity,
                estimated_price=receipt_item.unit_price
            )
        
        # Calculate estimated total
        shopping_list.calculate_estimated_total()
        
        return Response(
            ShoppingListSerializer(shopping_list).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def compare_list_prices(request, list_id):
    """Compare shopping list prices across stores with better analysis"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    
    # Get all items with linked products
    items = shopping_list.items.filter(product__isnull=False).select_related('product')
    
    if not items.exists():
        return Response({
            'message': 'No items with linked products to compare',
            'list_id': list_id,
            'list_name': shopping_list.name
        })
    
    # Store totals for single-store shopping
    store_totals = {}
    items_comparison = []
    
    # For analysis
    items_with_multiple_stores = 0
    optimal_total = 0
    single_store_totals = {}
    
    for item in items:
        product = item.product
        quantity = float(item.quantity)
        
        # Get current prices for this product
        prices = PriceHistory.objects.filter(
            product=product,
            is_active=True,
            is_approved=True
        ).select_related('store')
        
        if not prices.exists():
            continue
        
        # Build price data for each store
        store_prices = []
        best_price = None
        best_store_name = None
        
        for price in prices:
            store_name = price.store.name
            unit_price = float(price.price)
            total_price = unit_price * quantity
            
            store_prices.append({
                'store_id': price.store.id,
                'store_name': store_name,
                'unit_price': unit_price,
                'total_price': total_price
            })
            
            # Track store totals for single-store shopping
            if store_name not in single_store_totals:
                single_store_totals[store_name] = 0
            single_store_totals[store_name] += total_price
            
            # Track best price for this item
            if best_price is None or unit_price < best_price:
                best_price = unit_price
                best_store_name = store_name
        
        # Check if this item has price variations across stores
        if len(prices) > 1:
            prices_list = [float(price.price) for price in prices]
            if max(prices_list) != min(prices_list):
                items_with_multiple_stores += 1
        
        # Add to optimal total (buying each item at its best price)
        optimal_total += best_price * quantity
        
        items_comparison.append({
            'item_id': item.id,
            'product_name': item.product_name,
            'quantity': quantity,
            'stores': store_prices,
            'best_price': best_price,
            'best_store': best_store_name
        })
    
    # Find best single store
    best_single_store = min(single_store_totals, key=single_store_totals.get) if single_store_totals else None
    best_single_store_total = single_store_totals.get(best_single_store, 0) if best_single_store else 0
    
    # Calculate potential savings from multi-store shopping
    potential_savings = best_single_store_total - optimal_total if best_single_store else 0
    
    # Generate appropriate message based on the situation
    message = generate_comparison_message(
        items_with_multiple_stores, 
        potential_savings, 
        len(single_store_totals),
        best_single_store
    )
    
    response_data = {
        'list_id': shopping_list.id,
        'list_name': shopping_list.name,
        'items': items_comparison,
        'store_totals': {k: round(v, 2) for k, v in single_store_totals.items()},
        'best_store': best_single_store,  # Keep for backward compatibility
        'potential_savings': round(potential_savings, 2),
        'optimal_total': round(optimal_total, 2),
        'best_single_store_total': round(best_single_store_total, 2),
        'items_with_price_variations': items_with_multiple_stores,
        'message': message
    }
    
    return Response(response_data)

def generate_comparison_message(items_with_variations, savings, store_count, best_store):
    """Generate appropriate message based on the price comparison results"""
    if store_count == 0:
        return "No store price data available"
    
    if store_count == 1:
        return f"All items available at {best_store}. No store choice needed."
    
    if items_with_variations == 0:
        return f"All stores have similar pricing for your items. Choose based on convenience."
    
    if savings > 0:
        return f"Save ${savings:.2f} by shopping at multiple stores for the best prices"
    else:
        return f"{best_store} has the best overall prices for all your items"

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def auto_estimate_prices(request, list_id):
    """Automatically estimate prices for items based on price history"""
    shopping_list = get_object_or_404(ShoppingList, id=list_id, user=request.user)
    
    updated_count = 0
    for item in shopping_list.items.all():
        if item.product and not item.estimated_price:
            # Get lowest current price for this product
            lowest_price = item.product.get_lowest_price()
            if lowest_price:
                item.estimated_price = lowest_price.price
                item.save()
                updated_count += 1
    
    # Recalculate total
    shopping_list.calculate_estimated_total()
    
    return Response({
        'message': f'Estimated prices updated for {updated_count} items',
        'updated_count': updated_count,
        'estimated_total': float(shopping_list.estimated_total)
    })
