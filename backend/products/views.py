"""
Views for products app
backend/products/views.py
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Min, Max, F
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
    """Get all active stores"""
    stores = Store.objects.filter(is_active=True).order_by('name')
    serializer = StoreListSerializer(stores, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_store_detail(request, store_id):
    """Get detailed information about a store"""
    store = get_object_or_404(Store, id=store_id)
    serializer = StoreSerializer(store)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_store(request):
    """Create a new store"""
    serializer = StoreSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_store(request, store_id):
    """Update store information"""
    store = get_object_or_404(Store, id=store_id)
    serializer = StoreSerializer(store, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_store(request, store_id):
    """Soft delete a store (set is_active to False)"""
    store = get_object_or_404(Store, id=store_id)
    store.is_active = False
    store.save()
    return Response({'message': 'Store deactivated successfully'}, status=status.HTTP_200_OK)


# ===================== CATEGORY VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_categories(request):
    """Get all categories"""
    # Get root categories (no parent)
    categories = Category.objects.filter(parent=None).order_by('name')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_category_detail(request, category_id):
    """Get detailed information about a category"""
    category = get_object_or_404(Category, id=category_id)
    serializer = CategorySerializer(category)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_category(request):
    """Create a new category"""
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_category(request, category_id):
    """Update category information"""
    category = get_object_or_404(Category, id=category_id)
    serializer = CategorySerializer(category, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_category(request, category_id):
    """Delete a category"""
    category = get_object_or_404(Category, id=category_id)
    category.delete()
    return Response({'message': 'Category deleted successfully'}, status=status.HTTP_200_OK)


# ===================== PRODUCT VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_products(request):
    """Get all products with pagination"""
    products = Product.objects.filter(is_active=True).select_related('category').order_by('name')
    
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
def get_product_detail(request, product_id):
    """Get detailed information about a product"""
    product = get_object_or_404(Product, id=product_id)
    serializer = ProductSerializer(product)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_product(request):
    """Create a new product"""
    serializer = ProductCreateSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save()
        return Response(
            ProductSerializer(product).data, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_product(request, product_id):
    """Update product information"""
    product = get_object_or_404(Product, id=product_id)
    serializer = ProductCreateSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(ProductSerializer(product).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_product(request, product_id):
    """Soft delete a product (set is_active to False)"""
    product = get_object_or_404(Product, id=product_id)
    product.is_active = False
    product.save()
    return Response({'message': 'Product deactivated successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def search_products(request):
    """Search products by name, brand, or barcode"""
    serializer = ProductSearchSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    query = serializer.validated_data['query']
    category_id = serializer.validated_data.get('category')
    store_id = serializer.validated_data.get('store')
    
    # Build query
    products = Product.objects.filter(is_active=True)
    products = products.filter(
        Q(name__icontains=query) |
        Q(normalized_name__icontains=query) |
        Q(brand__icontains=query) |
        Q(barcode__icontains=query)
    )
    
    if category_id:
        products = products.filter(category_id=category_id)
    
    if store_id:
        products = products.filter(price_history__store_id=store_id, price_history__is_active=True).distinct()
    
    products = products.select_related('category')[:20]  # Limit to 20 results
    
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


# ===================== PRICE VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_product_prices(request, product_id):
    """Get all price history for a product"""
    product = get_object_or_404(Product, id=product_id)
    prices = product.price_history.all().select_related('store').order_by('-date_recorded')
    
    # Filter by store if provided
    store_id = request.query_params.get('store')
    if store_id:
        prices = prices.filter(store_id=store_id)
    
    serializer = PriceHistorySerializer(prices, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_price(request):
    """Add a new price record for a product"""
    serializer = AddPriceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def compare_product_prices(request, product_id):
    """Compare prices for a product across all stores"""
    product = get_object_or_404(Product, id=product_id)
    
    # Get active prices for all stores
    active_prices = product.price_history.filter(is_active=True).select_related('store')
    
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
    """Compare prices for multiple products across stores"""
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
            active_prices = product.price_history.filter(is_active=True).select_related('store')
            
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

