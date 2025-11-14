"""
Serializers for shopping_lists app
backend/shopping_lists/serializers.py
"""

from rest_framework import serializers
from .models import ShoppingList, ShoppingListItem
from products.models import Product
from products.serializers import ProductListSerializer


class ShoppingListItemSerializer(serializers.ModelSerializer):
    """Serializer for shopping list items"""
    product_details = ProductListSerializer(source='product', read_only=True)
    product_brand = serializers.CharField(source='product.brand', read_only=True)
    
    class Meta:
        model = ShoppingListItem
        fields = [
            'id', 'shopping_list', 'product', 'product_details',
            'product_name', 'product_brand', 'quantity', 'unit',
            'estimated_price', 'notes', 'is_checked', 'position',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ShoppingListItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating shopping list items"""
    
    class Meta:
        model = ShoppingListItem
        fields = [
            'product', 'product_name', 'quantity', 'unit',
            'estimated_price', 'notes', 'position'
        ]
    
    def validate(self, attrs):
        """Ensure product_name is provided if product is not"""
        if not attrs.get('product') and not attrs.get('product_name'):
            raise serializers.ValidationError(
                "Either product or product_name must be provided."
            )
        
        # Auto-populate product_name from product if not provided
        if attrs.get('product') and not attrs.get('product_name'):
            attrs['product_name'] = attrs['product'].name
        
        return attrs


class ShoppingListItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating shopping list items"""
    
    class Meta:
        model = ShoppingListItem
        fields = [
            'product', 'product_name', 'quantity', 'unit',
            'estimated_price', 'notes', 'is_checked', 'position'
        ]


class ShoppingListSerializer(serializers.ModelSerializer):
    """Serializer for shopping lists with items"""
    items = ShoppingListItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    checked_items_count = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ShoppingList
        fields = [
            'id', 'user', 'name', 'status', 'notes',
            'estimated_total', 'items', 'items_count',
            'checked_items_count', 'progress_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'estimated_total', 'created_at', 'updated_at']
    
    def get_items_count(self, obj):
        """Get total number of items"""
        return obj.get_items_count()
    
    def get_checked_items_count(self, obj):
        """Get number of checked items"""
        return obj.get_checked_items_count()
    
    def get_progress_percentage(self, obj):
        """Calculate completion percentage"""
        total = obj.get_items_count()
        if total == 0:
            return 0
        checked = obj.get_checked_items_count()
        return round((checked / total) * 100, 2)


class ShoppingListListSerializer(serializers.ModelSerializer):
    """Minimal serializer for shopping list listings"""
    items_count = serializers.SerializerMethodField()
    checked_items_count = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ShoppingList
        fields = [
            'id', 'name', 'status', 'estimated_total',
            'items_count', 'checked_items_count', 
            'progress_percentage', 'created_at', 'updated_at'
        ]
    
    def get_items_count(self, obj):
        return obj.get_items_count()
    
    def get_checked_items_count(self, obj):
        return obj.get_checked_items_count()
    
    def get_progress_percentage(self, obj):
        total = obj.get_items_count()
        if total == 0:
            return 0
        checked = obj.get_checked_items_count()
        return round((checked / total) * 100, 2)


class ShoppingListCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating shopping lists"""
    
    class Meta:
        model = ShoppingList
        fields = ['name', 'status', 'notes']
    
    def create(self, validated_data):
        """Create shopping list for current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ShoppingListUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating shopping lists"""
    
    class Meta:
        model = ShoppingList
        fields = ['name', 'status', 'notes']


class AddItemsToListSerializer(serializers.Serializer):
    """Serializer for adding multiple items to a list"""
    items = ShoppingListItemCreateSerializer(many=True)
    
    def validate_items(self, value):
        """Ensure at least one item is provided"""
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value


class GenerateListFromReceiptSerializer(serializers.Serializer):
    """Serializer for generating shopping list from receipt"""
    receipt_id = serializers.IntegerField()
    list_name = serializers.CharField(max_length=255, required=False)
    
    def validate_receipt_id(self, value):
        """Check if receipt exists and belongs to user"""
        from receipts.models import Receipt
        user = self.context['request'].user
        
        if not Receipt.objects.filter(id=value, user=user).exists():
            raise serializers.ValidationError("Receipt not found or access denied.")
        
        return value


class PriceComparisonItemSerializer(serializers.Serializer):
    """Serializer for items with price comparison"""
    item_id = serializers.IntegerField()
    product_name = serializers.CharField()
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)
    stores = serializers.ListField()
    best_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    best_store = serializers.CharField()


class ListPriceComparisonSerializer(serializers.Serializer):
    """Serializer for shopping list price comparison across stores"""
    list_id = serializers.IntegerField()
    list_name = serializers.CharField()
    items = PriceComparisonItemSerializer(many=True)
    store_totals = serializers.DictField()
    best_store = serializers.CharField()
    potential_savings = serializers.DecimalField(max_digits=10, decimal_places=2)


class ReorderItemsSerializer(serializers.Serializer):
    """Serializer for reordering items"""
    item_orders = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField())
    )
    
    def validate_item_orders(self, value):
        """Validate format: [{"item_id": 1, "position": 0}, ...]"""
        for item in value:
            if 'item_id' not in item or 'position' not in item:
                raise serializers.ValidationError(
                    "Each item must have 'item_id' and 'position' fields."
                )
        return value
    