"""
Serializers for receipts app
backend/receipts/serializers.py
"""

from rest_framework import serializers
from .models import Receipt, ReceiptItem
from products.models import Product


class ReceiptItemSerializer(serializers.ModelSerializer):
    """Serializer for receipt items"""
    product_name_display = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand', read_only=True)
    
    class Meta:
        model = ReceiptItem
        fields = [
            'id', 'receipt', 'product_name', 'normalized_name',
            'quantity', 'unit_price', 'total_price', 'category',
            'product', 'product_name_display', 'product_brand',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_price']


class ReceiptItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating receipt items"""
    
    class Meta:
        model = ReceiptItem
        fields = [
            'product_name', 'normalized_name', 'quantity',
            'unit_price', 'total_price', 'category', 'product'
        ]
    
    def validate(self, attrs):
        """Auto-calculate total price if not provided"""
        if 'total_price' not in attrs or not attrs['total_price']:
            attrs['total_price'] = attrs['quantity'] * attrs['unit_price']
        return attrs


class ReceiptSerializer(serializers.ModelSerializer):
    """Serializer for receipts with items"""
    items = ReceiptItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    receipt_image_url = serializers.SerializerMethodField()
    receipt_thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'user', 'store_name', 'store_location',
            'purchase_date', 'total_amount', 'tax_amount',
            'receipt_image', 'receipt_image_url', 'receipt_thumbnail_url',
            'ocr_text', 'status', 'processing_error',
            'items', 'items_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'ocr_text', 'status', 
            'processing_error', 'created_at', 'updated_at'
        ]
    
    def get_items_count(self, obj):
        """Get count of items in receipt"""
        return obj.items.count()
    
    def get_receipt_image_url(self, obj):
        """Get full URL for receipt image"""
        if obj.receipt_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt_image.url)
            return obj.receipt_image.url
        return None
    
    def get_receipt_thumbnail_url(self, obj):
        """Get full URL for receipt thumbnail"""
        if obj.receipt_thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt_thumbnail.url)
            return obj.receipt_thumbnail.url
        return None


class ReceiptListSerializer(serializers.ModelSerializer):
    """Minimal serializer for receipt lists"""
    items_count = serializers.SerializerMethodField()
    receipt_thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'store_name', 'store_location',
            'purchase_date', 'total_amount', 'status',
            'items_count', 'receipt_thumbnail_url', 'created_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_receipt_thumbnail_url(self, obj):
        if obj.receipt_thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt_thumbnail.url)
            return obj.receipt_thumbnail.url
        return None


class ReceiptUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading receipts"""
    
    class Meta:
        model = Receipt
        fields = ['receipt_image', 'store_name', 'store_location', 'purchase_date']
    
    def create(self, validated_data):
        """Create receipt with pending status"""
        validated_data['status'] = 'pending'
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReceiptUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating receipt information"""
    
    class Meta:
        model = Receipt
        fields = [
            'store_name', 'store_location', 'purchase_date',
            'total_amount', 'tax_amount'
        ]


class ReceiptItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating receipt items"""
    
    class Meta:
        model = ReceiptItem
        fields = [
            'product_name', 'normalized_name', 'quantity',
            'unit_price', 'total_price', 'category', 'product'
        ]
    
    def validate(self, attrs):
        """Recalculate total price if quantity or unit_price changed"""
        if 'quantity' in attrs or 'unit_price' in attrs:
            quantity = attrs.get('quantity', self.instance.quantity)
            unit_price = attrs.get('unit_price', self.instance.unit_price)
            attrs['total_price'] = quantity * unit_price
        return attrs


class AddReceiptItemsSerializer(serializers.Serializer):
    """Serializer for adding multiple items to a receipt"""
    items = ReceiptItemCreateSerializer(many=True)
    
    def validate_items(self, value):
        """Ensure at least one item is provided"""
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value


class ProcessReceiptSerializer(serializers.Serializer):
    """Serializer for processing receipt OCR"""
    receipt_id = serializers.IntegerField()


class ReceiptStatsSerializer(serializers.Serializer):
    """Serializer for receipt statistics"""
    total_receipts = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    receipts_this_month = serializers.IntegerField()
    spent_this_month = serializers.DecimalField(max_digits=10, decimal_places=2)
    top_stores = serializers.ListField()
    recent_receipts = ReceiptListSerializer(many=True)
    