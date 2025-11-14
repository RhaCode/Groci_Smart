"""
User profile extension model
backend/accounts/models.py
"""

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """Extended user profile for additional information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    budget_limit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.username}'s Profile"


class UserPreferredStore(models.Model):
    """User's preferred stores - Many-to-Many relationship"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='preferred_stores')
    store = models.ForeignKey('products.Store', on_delete=models.CASCADE, related_name='preferred_by_users')
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_preferred_stores'
        unique_together = ['user', 'store']
        ordering = ['added_at']
    
    def __str__(self):
        return f"{self.user.username} prefers {self.store.name}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create a user profile when a user is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the user profile whenever the user is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()
        