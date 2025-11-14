"""
URL Configuration for products app
backend/products/urls.py
"""

from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # Store endpoints
    path('stores/', views.get_stores, name='get_stores'),
    path('stores/<int:store_id>/', views.get_store_detail, name='get_store_detail'),
    path('stores/create/', views.create_store, name='create_store'),
    path('stores/<int:store_id>/update/', views.update_store, name='update_store'),
    path('stores/<int:store_id>/delete/', views.delete_store, name='delete_store'),
    
    # Category endpoints
    path('categories/', views.get_categories, name='get_categories'),
    path('categories/<int:category_id>/', views.get_category_detail, name='get_category_detail'),
    path('categories/create/', views.create_category, name='create_category'),
    path('categories/<int:category_id>/update/', views.update_category, name='update_category'),
    path('categories/<int:category_id>/delete/', views.delete_category, name='delete_category'),
    
    # Product endpoints
    path('', views.get_products, name='get_products'),
    path('<int:product_id>/', views.get_product_detail, name='get_product_detail'),
    path('create/', views.create_product, name='create_product'),
    path('<int:product_id>/update/', views.update_product, name='update_product'),
    path('<int:product_id>/delete/', views.delete_product, name='delete_product'),
    path('search/', views.search_products, name='search_products'),
    
    # Price endpoints
    path('<int:product_id>/prices/', views.get_product_prices, name='get_product_prices'),
    path('prices/add/', views.add_price, name='add_price'),
    path('<int:product_id>/compare/', views.compare_product_prices, name='compare_product_prices'),
    path('compare-multiple/', views.compare_multiple_products, name='compare_multiple_products'),
]