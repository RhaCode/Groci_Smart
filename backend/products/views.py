"""
Views for products app with complete approval workflow
backend/products/views.py
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Store, Category, Product, PriceHistory
from .serializers import (
    StoreSerializer,
    StoreListSerializer,
    CategorySerializer,
    CategoryListSerializer,
    ProductSerializer,
    ProductListSerializer,
    ProductCreateSerializer,
    PriceHistorySerializer,
    PriceComparisonSerializer,
    AddPriceSerializer,
    ProductSearchSerializer
)


# ===================== STORE VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_stores(request):
    """Get stores - staff sees all, regular users see only approved"""
    if request.user.is_staff:
        stores = Store.objects.filter(is_active=True).order_by('name')
    else:
        stores = Store.objects.filter(is_active=True, is_approved=True).order_by('name')
    
    serializer = StoreListSerializer(stores, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pending_stores(request):
    """Get stores pending approval - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can view pending stores'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    stores = Store.objects.filter(is_active=True, is_approved=False).order_by('-created_at')
    serializer = StoreSerializer(stores, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_store_detail(request, store_id):
    """Get detailed information about a store"""
    store = get_object_or_404(Store, id=store_id)
    
    if not request.user.is_staff and not store.is_approved:
        return Response(
            {'error': 'Store not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = StoreSerializer(store)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_store(request):
    """Create a new store - auto-approved for staff, pending for regular users"""
    serializer = StoreSerializer(data=request.data)
    if serializer.is_valid():
        store = serializer.save(
            created_by=request.user,
            is_approved=request.user.is_staff
        )
        return Response(
            StoreSerializer(store).data, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def approve_store(request, store_id):
    """Approve a pending store - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can approve stores'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    store = get_object_or_404(Store, id=store_id)
    store.is_approved = True
    store.save()
    return Response(StoreSerializer(store).data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def reject_store(request, store_id):
    """Reject a pending store - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can reject stores'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    store = get_object_or_404(Store, id=store_id)
    store.is_active = False
    store.save()
    return Response({'message': 'Store rejected and deactivated'})


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_store(request, store_id):
    """Update store - staff can edit all, users can edit their own pending stores"""
    store = get_object_or_404(Store, id=store_id)
    
    if not request.user.is_staff:
        if store.created_by != request.user or store.is_approved:
            return Response(
                {'error': 'You can only edit your own unapproved stores'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    
    serializer = StoreSerializer(store, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_store(request, store_id):
    """Delete a store - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can delete stores'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    store = get_object_or_404(Store, id=store_id)
    store.is_active = False
    store.save()
    return Response({'message': 'Store deactivated successfully'})


# ===================== CATEGORY VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_categories(request):
    """Get categories - staff sees all, regular users see only approved"""
    if request.user.is_staff:
        categories = Category.objects.filter(parent=None).order_by('name')
    else:
        categories = Category.objects.filter(parent=None, is_approved=True).order_by('name')
    
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pending_categories(request):
    """Get categories pending approval - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can view pending categories'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    categories = Category.objects.filter(is_approved=False).order_by('-created_at')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_category_detail(request, category_id):
    """Get detailed information about a category"""
    category = get_object_or_404(Category, id=category_id)
    
    if not request.user.is_staff and not category.is_approved:
        return Response(
            {'error': 'Category not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = CategorySerializer(category)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_category(request):
    """Create a new category - auto-approved for staff, pending for regular users"""
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        category = serializer.save(
            created_by=request.user,
            is_approved=request.user.is_staff
        )
        return Response(
            CategorySerializer(category).data, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def approve_category(request, category_id):
    """Approve a pending category - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can approve categories'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    category = get_object_or_404(Category, id=category_id)
    category.is_approved = True
    category.save()
    return Response(CategorySerializer(category).data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def reject_category(request, category_id):
    """Reject a pending category - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can reject categories'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    category = get_object_or_404(Category, id=category_id)
    category.delete()
    return Response({'message': 'Category rejected and deleted'})


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_category(request, category_id):
    """Update category - staff can edit all, users can edit their own pending categories"""
    category = get_object_or_404(Category, id=category_id)
    
    if not request.user.is_staff:
        if category.created_by != request.user or category.is_approved:
            return Response(
                {'error': 'You can only edit your own unapproved categories'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    
    serializer = CategorySerializer(category, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_category(request, category_id):
    """Delete a category - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can delete categories'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    category = get_object_or_404(Category, id=category_id)
    category.delete()
    return Response({'message': 'Category deleted successfully'})


# ===================== PRODUCT VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_products(request):
    """Get products - staff sees all, regular users see only approved"""
    if request.user.is_staff:
        products = Product.objects.filter(is_active=True)
    else:
        products = Product.objects.filter(is_active=True, is_approved=True)
    
    products = products.select_related('category').order_by('name')
    
    # Apply filters
    category_id = request.query_params.get('category')
    if category_id:
        products = products.filter(category_id=category_id)
    
    brand = request.query_params.get('brand')
    if brand:
        products = products.filter(brand__icontains=brand)
    
    # Pagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(products, request)
    serializer = ProductListSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pending_products(request):
    """Get products pending approval - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can view pending products'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    products = Product.objects.filter(
        is_active=True, 
        is_approved=False
    ).select_related('category').order_by('-created_at')
    
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_product_detail(request, product_id):
    """Get detailed information about a product"""
    product = get_object_or_404(Product, id=product_id)
    
    if not request.user.is_staff and not product.is_approved:
        return Response(
            {'error': 'Product not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ProductSerializer(product)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_product(request):
    """Create a new product - auto-approved for staff, pending for regular users"""
    serializer = ProductCreateSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save(
            created_by=request.user,
            is_approved=request.user.is_staff
        )
        return Response(
            ProductSerializer(product).data, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def approve_product(request, product_id):
    """Approve a pending product - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can approve products'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    product = get_object_or_404(Product, id=product_id)
    product.is_approved = True
    product.save()
    return Response(ProductSerializer(product).data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def reject_product(request, product_id):
    """Reject a pending product - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can reject products'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    product = get_object_or_404(Product, id=product_id)
    product.is_active = False
    product.save()
    return Response({'message': 'Product rejected and deactivated'})


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_product(request, product_id):
    """Update product - staff can edit all, users can edit their own pending products"""
    product = get_object_or_404(Product, id=product_id)
    
    if not request.user.is_staff:
        if product.created_by != request.user or product.is_approved:
            return Response(
                {'error': 'You can only edit your own unapproved products'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    
    serializer = ProductCreateSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(ProductSerializer(product).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_product(request, product_id):
    """Delete a product - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can delete products'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    product = get_object_or_404(Product, id=product_id)
    product.is_active = False
    product.save()
    return Response({'message': 'Product deactivated successfully'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def search_products(request):
    """Search products - staff sees all, regular users see only approved"""
    serializer = ProductSearchSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    query = serializer.validated_data['query']
    category_id = serializer.validated_data.get('category')
    store_id = serializer.validated_data.get('store')
    
    # Build base query
    if request.user.is_staff:
        products = Product.objects.filter(is_active=True)
    else:
        products = Product.objects.filter(is_active=True, is_approved=True)
    
    # Apply search filters
    products = products.filter(
        Q(name__icontains=query) |
        Q(normalized_name__icontains=query) |
        Q(brand__icontains=query) |
        Q(barcode__icontains=query)
    )
    
    if category_id:
        products = products.filter(category_id=category_id)
    
    if store_id:
        products = products.filter(
            price_history__store_id=store_id, 
            price_history__is_active=True,
            price_history__is_approved=True
        ).distinct()
    
    products = products.select_related('category')[:20]
    
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


# ===================== PRICE VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_product_prices(request, product_id):
    """Get price history for a product - staff sees all, users see approved only"""
    product = get_object_or_404(Product, id=product_id)
    
    if not request.user.is_staff and not product.is_approved:
        return Response(
            {'error': 'Product not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.user.is_staff:
        prices = product.price_history.all()
    else:
        prices = product.price_history.filter(is_approved=True)
    
    prices = prices.select_related('store').order_by('-date_recorded')
    
    # Filter by store if provided
    store_id = request.query_params.get('store')
    if store_id:
        prices = prices.filter(store_id=store_id)
    
    serializer = PriceHistorySerializer(prices, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pending_prices(request):
    """Get prices pending approval - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can view pending prices'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    prices = PriceHistory.objects.filter(
        is_approved=False
    ).select_related('product', 'store').order_by('-created_at')
    
    serializer = PriceHistorySerializer(prices, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_price(request):
    """Add a new price record - auto-approved for staff, pending for regular users"""
    serializer = AddPriceSerializer(data=request.data)
    if serializer.is_valid():
        price = serializer.save(
            created_by=request.user,
            is_approved=request.user.is_staff,
            is_active=request.user.is_staff  # Only active if approved
        )
        return Response(
            PriceHistorySerializer(price).data, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def approve_price(request, price_id):
    """Approve a pending price - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can approve prices'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    price = get_object_or_404(PriceHistory, id=price_id)
    price.is_approved = True
    price.is_active = True
    price.save()  # This will trigger the save method to deactivate old prices
    return Response(PriceHistorySerializer(price).data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def reject_price(request, price_id):
    """Reject a pending price - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can reject prices'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    price = get_object_or_404(PriceHistory, id=price_id)
    price.delete()
    return Response({'message': 'Price rejected and deleted'})


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_price(request, price_id):
    """Update price - staff can edit all, users can edit their own pending prices"""
    price = get_object_or_404(PriceHistory, id=price_id)
    
    if not request.user.is_staff:
        if price.created_by != request.user or price.is_approved:
            return Response(
                {'error': 'You can only edit your own unapproved prices'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    
    serializer = AddPriceSerializer(price, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(PriceHistorySerializer(price).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_price(request, price_id):
    """Delete a price - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can delete prices'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    price = get_object_or_404(PriceHistory, id=price_id)
    price.delete()
    return Response({'message': 'Price deleted successfully'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def compare_product_prices(request, product_id):
    """Compare approved prices for a product across all stores"""
    product = get_object_or_404(Product, id=product_id)
    
    if not request.user.is_staff and not product.is_approved:
        return Response(
            {'error': 'Product not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get active approved prices for all approved stores
    if request.user.is_staff:
        active_prices = product.price_history.filter(
            is_active=True,
            is_approved=True
        ).select_related('store')
    else:
        active_prices = product.price_history.filter(
            is_active=True,
            is_approved=True,
            store__is_approved=True
        ).select_related('store')
    
    if not active_prices.exists():
        return Response({
            'message': 'No prices available for this product',
            'product_id': product_id,
            'product_name': product.name
        })
    
    # Build price comparison data
    prices_data = []
    for price in active_prices:
        prices_data.append({
            'store_id': price.store.id,
            'store_name': price.store.name,
            'store_location': price.store.location,
            'price': float(price.price),
            'date_recorded': price.date_recorded
        })
    
    # Calculate statistics
    price_values = [p['price'] for p in prices_data]
    lowest = min(price_values)
    highest = max(price_values)
    difference = highest - lowest
    savings_percentage = (difference / highest * 100) if highest > 0 else 0
    
    response_data = {
        'product_id': product.id,
        'product_name': product.name,
        'brand': product.brand,
        'prices': prices_data,
        'lowest_price': lowest,
        'highest_price': highest,
        'price_difference': difference,
        'savings_percentage': round(savings_percentage, 2)
    }
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def compare_multiple_products(request):
    """Compare approved prices for multiple products across stores"""
    product_ids = request.data.get('product_ids', [])
    
    if not product_ids:
        return Response(
            {'error': 'product_ids array is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    results = []
    for product_id in product_ids:
        try:
            product = Product.objects.get(id=product_id)
            
            # Skip unapproved products for regular users
            if not request.user.is_staff and not product.is_approved:
                continue
            
            # Get active approved prices for approved stores
            if request.user.is_staff:
                active_prices = product.price_history.filter(
                    is_active=True,
                    is_approved=True
                ).select_related('store')
            else:
                active_prices = product.price_history.filter(
                    is_active=True,
                    is_approved=True,
                    store__is_approved=True
                ).select_related('store')
            
            if active_prices.exists():
                prices_data = []
                for price in active_prices:
                    prices_data.append({
                        'store_id': price.store.id,
                        'store_name': price.store.name,
                        'price': float(price.price)
                    })
                
                price_values = [p['price'] for p in prices_data]
                lowest = min(price_values)
                highest = max(price_values)
                
                results.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'brand': product.brand,
                    'prices': prices_data,
                    'lowest_price': lowest,
                    'highest_price': highest,
                    'price_difference': highest - lowest
                })
        except Product.DoesNotExist:
            continue
    
    return Response({'results': results})


# ===================== ADMIN DASHBOARD VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_pending_approvals_count(request):
    """Get count of all pending approvals - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can view pending approvals'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    pending_stores = Store.objects.filter(is_active=True, is_approved=False).count()
    pending_categories = Category.objects.filter(is_approved=False).count()
    pending_products = Product.objects.filter(is_active=True, is_approved=False).count()
    pending_prices = PriceHistory.objects.filter(is_approved=False).count()
    
    return Response({
        'pending_stores': pending_stores,
        'pending_categories': pending_categories,
        'pending_products': pending_products,
        'pending_prices': pending_prices,
        'total_pending': pending_stores + pending_categories + pending_products + pending_prices
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_all_pending_items(request):
    """Get all pending items for admin dashboard - staff only"""
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can view pending items'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    pending_stores = Store.objects.filter(
        is_active=True, 
        is_approved=False
    ).order_by('-created_at')[:10]
    
    pending_categories = Category.objects.filter(
        is_approved=False
    ).order_by('-created_at')[:10]
    
    pending_products = Product.objects.filter(
        is_active=True, 
        is_approved=False
    ).select_related('category').order_by('-created_at')[:10]
    
    pending_prices = PriceHistory.objects.filter(
        is_approved=False
    ).select_related('product', 'store').order_by('-created_at')[:10]
    
    return Response({
        'stores': StoreSerializer(pending_stores, many=True).data,
        'categories': CategorySerializer(pending_categories, many=True).data,
        'products': ProductSerializer(pending_products, many=True).data,
        'prices': PriceHistorySerializer(pending_prices, many=True).data,
    })