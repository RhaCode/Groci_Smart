"""
Receipt and Receipt Item models
backend/receipts/models.py
"""

from django.db import models
from django.contrib.auth.models import User
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill


class Receipt(models.Model):
    """Main receipt model"""
    STATUS_CHOICES = [
        ('pending', 'Pending Processing'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receipts')
    store_name = models.CharField(max_length=255, blank=True)
    store_location = models.CharField(max_length=255, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    
    # Image fields
    receipt_image = models.ImageField(upload_to='receipts/%Y/%m/%d/')
    receipt_thumbnail = ImageSpecField(
        source='receipt_image',
        processors=[ResizeToFill(300, 400)],
        format='JPEG',
        options={'quality': 85}
    )
    
    # OCR and processing
    ocr_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processing_error = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'receipts'
        ordering = ['-purchase_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'purchase_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Receipt from {self.store_name} - {self.purchase_date or self.created_at.date()}"

    def calculate_total(self):
        """Calculate total from receipt items"""
        total = sum(item.total_price for item in self.items.all())
        self.total_amount = total
        self.save()
        return total


class ReceiptItem(models.Model):
    """Individual items from a receipt"""
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=255)
    normalized_name = models.CharField(max_length=255, blank=True)  # For price comparison
    quantity = models.DecimalField(max_digits=10, decimal_places=3, default=1.0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, blank=True)
    
    # Link to product for price comparison
    product = models.ForeignKey(
        'products.Product', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='receipt_items'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'receipt_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product_name} - ${self.total_price}"

    def save(self, *args, **kwargs):
        """Auto-calculate total price if not provided"""
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        