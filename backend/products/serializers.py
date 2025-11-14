"""
Serializers for products app
backend/products/serializers.py
"""

from rest_framework import serializers
from .models import Store, Category, Product, PriceHistory
from django.utils import timezone


class StoreSerializer(serializers.ModelSerializer):
    """Serializer for Store model"""
    
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'location', 'address', 
            'latitude', 'longitude', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StoreListSerializer(serializers.ModelSerializer):
    """Minimal serializer for store lists"""
    
    class Meta:
        model = Store
        fields = ['id', 'name', 'location']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    subcategories = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'parent', 
            'parent_name', 'subcategories', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_subcategories(self, obj):
        """Get subcategories if they exist"""
        if obj.subcategories.exists():
            return CategoryListSerializer(obj.subcategories.all(), many=True).data
        return []


class CategoryListSerializer(serializers.ModelSerializer):
    """Minimal serializer for category lists"""
    
    class Meta:
        model = Category
        fields = ['id', 'name']


class PriceHistorySerializer(serializers.ModelSerializer):
    """Serializer for Price History"""
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_location = serializers.CharField(source='store.location', read_only=True)
    
    class Meta:
        model = PriceHistory
        fields = [
            'id', 'product', 'store', 'store_name', 
            'store_location', 'price', 'date_recorded',
            'is_active', 'source', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_prices = serializers.SerializerMethodField()
    lowest_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'normalized_name', 'category',
            'category_name', 'brand', 'unit', 'barcode',
            'description', 'is_active', 'current_prices',
            'lowest_price', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_prices(self, obj):
        """Get current active prices for all stores"""
        prices = obj.price_history.filter(is_active=True).select_related('store')
        return PriceHistorySerializer(prices, many=True).data
    
    def get_lowest_price(self, obj):
        """Get the lowest current price"""
        lowest = obj.get_lowest_price()
        if lowest:
            return {
                'price': float(lowest.price),
                'store': lowest.store.name,
                'store_id': lowest.store.id
            }
        return None


class ProductListSerializer(serializers.ModelSerializer):
    """Minimal serializer for product lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    lowest_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'unit', 
            'category_name', 'lowest_price'
        ]
    
    def get_lowest_price(self, obj):
        """Get the lowest current price"""
        lowest = obj.get_lowest_price()
        return float(lowest.price) if lowest else None


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'normalized_name', 'category',
            'brand', 'unit', 'barcode', 'description'
        ]
    
    def validate_barcode(self, value):
        """Ensure barcode is unique if provided"""
        if value and Product.objects.filter(barcode=value).exists():
            raise serializers.ValidationError("Product with this barcode already exists.")
        return value


class PriceComparisonSerializer(serializers.Serializer):
    """Serializer for price comparison results"""
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    brand = serializers.CharField()
    prices = serializers.ListField()
    lowest_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    highest_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    price_difference = serializers.DecimalField(max_digits=10, decimal_places=2)
    savings_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class AddPriceSerializer(serializers.ModelSerializer):
    """Serializer for adding new price records"""
    
    class Meta:
        model = PriceHistory
        fields = ['product', 'store', 'price', 'date_recorded', 'source']
    
    def validate(self, attrs):
        """Validate product and store exist"""
        if not Product.objects.filter(id=attrs['product'].id).exists():
            raise serializers.ValidationError({"product": "Product does not exist."})
        if not Store.objects.filter(id=attrs['store'].id).exists():
            raise serializers.ValidationError({"store": "Store does not exist."})
        return attrs
    
    def create(self, validated_data):
        """Create price history and set as active"""
        validated_data['is_active'] = True
        return super().create(validated_data)


class ProductSearchSerializer(serializers.Serializer):
    """Serializer for product search"""
    query = serializers.CharField(required=True, min_length=2)
    category = serializers.IntegerField(required=False)
    store = serializers.IntegerField(required=False)
    