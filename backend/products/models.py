"""
Product, Store, and Price History models
backend/products/models.py
"""

from django.db import models
from django.utils import timezone


class Store(models.Model):
    """Retail stores/supermarkets"""
    name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stores'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.location}"


class Category(models.Model):
    """Product categories"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='subcategories'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Product master data"""
    name = models.CharField(max_length=255)
    normalized_name = models.CharField(max_length=255, db_index=True)  # For matching
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='products'
    )
    brand = models.CharField(max_length=255, blank=True)
    unit = models.CharField(max_length=50, blank=True)  # e.g., "kg", "lbs", "each"
    barcode = models.CharField(max_length=100, blank=True, unique=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['name']
        indexes = [
            models.Index(fields=['normalized_name']),
            models.Index(fields=['barcode']),
        ]

    def __str__(self):
        return f"{self.name} ({self.brand})" if self.brand else self.name

    def get_current_price(self, store):
        """Get the most recent price for this product at a specific store"""
        latest_price = self.price_history.filter(
            store=store,
            is_active=True
        ).order_by('-date_recorded').first()
        return latest_price.price if latest_price else None

    def get_lowest_price(self):
        """Get the lowest current price across all stores"""
        latest_prices = self.price_history.filter(
            is_active=True
        ).order_by('price').first()
        return latest_prices if latest_prices else None


class PriceHistory(models.Model):
    """Historical price data for products across stores"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_history')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='prices')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    date_recorded = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=True)  # Most recent price per store
    source = models.CharField(max_length=50, default='receipt')  # receipt, manual, scraped
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'price_history'
        verbose_name_plural = 'Price Histories'
        ordering = ['-date_recorded']
        indexes = [
            models.Index(fields=['product', 'store', 'date_recorded']),
            models.Index(fields=['is_active']),
        ]
        unique_together = ['product', 'store', 'date_recorded']

    def __str__(self):
        return f"{self.product.name} @ {self.store.name} - ${self.price} ({self.date_recorded})"

    def save(self, *args, **kwargs):
        """When saving a new price, deactivate older prices for the same product-store combination"""
        if self.is_active:
            PriceHistory.objects.filter(
                product=self.product,
                store=self.store,
                is_active=True
            ).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)
        