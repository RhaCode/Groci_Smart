"""
Shopping List models
backend/shopping_lists/models.py
"""

from django.db import models
from django.contrib.auth.models import User


class ShoppingList(models.Model):
    """User's shopping lists"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shopping_lists')
    name = models.CharField(max_length=255, default="My Shopping List")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    estimated_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shopping_lists'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.name} - {self.user.username}"

    def calculate_estimated_total(self):
        """Calculate estimated total from items with prices"""
        total = sum(
            item.quantity * item.estimated_price 
            for item in self.items.all() 
            if item.estimated_price
        )
        self.estimated_total = total
        self.save()
        return total

    def get_items_count(self):
        """Get count of items in the list"""
        return self.items.count()

    def get_checked_items_count(self):
        """Get count of checked items"""
        return self.items.filter(is_checked=True).count()


class ShoppingListItem(models.Model):
    """Individual items in a shopping list"""
    shopping_list = models.ForeignKey(
        ShoppingList, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shopping_list_items'
    )
    product_name = models.CharField(max_length=255)  # Fallback if no product linked
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    unit = models.CharField(max_length=50, blank=True)
    estimated_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    notes = models.TextField(blank=True)
    is_checked = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)  # For ordering items
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shopping_list_items'
        ordering = ['position', 'created_at']
        indexes = [
            models.Index(fields=['shopping_list', 'is_checked']),
        ]

    def __str__(self):
        return f"{self.product_name} (x{self.quantity})"

    def save(self, *args, **kwargs):
        """Auto-populate product_name from product if linked"""
        if self.product and not self.product_name:
            self.product_name = self.product.name
        super().save(*args, **kwargs)
        