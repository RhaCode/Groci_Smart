"""
URL Configuration for accounts app
backend/accounts/urls.py
"""

from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    
    # Profile Management
    path('profile/', views.get_user_profile, name='profile'),
    path('profile/update/', views.update_user_profile, name='update_profile'),
    path('change-password/', views.change_password, name='change_password'),
    
    # Preferred Stores
    path('preferred-stores/', views.get_preferred_stores, name='get_preferred_stores'),
    path('preferred-stores/add/', views.add_preferred_store, name='add_preferred_store'),
    path('preferred-stores/<int:store_id>/remove/', views.remove_preferred_store, name='remove_preferred_store'),
    path('preferred-stores/<int:store_id>/check/', views.check_preferred_store, name='check_preferred_store'),
]