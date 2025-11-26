"""
URL Configuration for products app
backend/products/urls.py
"""

from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # ============= STORE ENDPOINTS =============
    path('stores/', views.get_stores, name='get_stores'),
    path('stores/pending/', views.get_pending_stores, name='get_pending_stores'),
    path('stores/<int:store_id>/', views.get_store_detail, name='get_store_detail'),
    path('stores/create/', views.create_store, name='create_store'),
    path('stores/<int:store_id>/approve/', views.approve_store, name='approve_store'),
    path('stores/<int:store_id>/reject/', views.reject_store, name='reject_store'),
    path('stores/<int:store_id>/update/', views.update_store, name='update_store'),
    path('stores/<int:store_id>/delete/', views.delete_store, name='delete_store'),
    
    # ============= CATEGORY ENDPOINTS =============
    path('categories/', views.get_categories, name='get_categories'),
    path('categories/pending/', views.get_pending_categories, name='get_pending_categories'),
    path('categories/<int:category_id>/', views.get_category_detail, name='get_category_detail'),
    path('categories/create/', views.create_category, name='create_category'),
    path('categories/<int:category_id>/approve/', views.approve_category, name='approve_category'),
    path('categories/<int:category_id>/reject/', views.reject_category, name='reject_category'),
    path('categories/<int:category_id>/update/', views.update_category, name='update_category'),
    path('categories/<int:category_id>/delete/', views.delete_category, name='delete_category'),
    
    # ============= PRODUCT ENDPOINTS =============
    path('products/', views.get_products, name='get_products'),
    path('products/pending/', views.get_pending_products, name='get_pending_products'),
    path('products/<int:product_id>/', views.get_product_detail, name='get_product_detail'),
    path('products/create/', views.create_product, name='create_product'),
    path('products/<int:product_id>/approve/', views.approve_product, name='approve_product'),
    path('products/<int:product_id>/reject/', views.reject_product, name='reject_product'),
    path('products/<int:product_id>/update/', views.update_product, name='update_product'),
    path('products/<int:product_id>/delete/', views.delete_product, name='delete_product'),
    path('products/search/', views.search_products, name='search_products'),
    
    # ============= PRICE ENDPOINTS =============
    path('prices/', views.get_all_prices, name='get_all_prices'), 
    path('prices/pending/', views.get_pending_prices, name='get_pending_prices'),
    path('prices/<int:price_id>/', views.get_price_detail, name='get_price_detail'),  
    path('prices/add/', views.add_price, name='add_price'),
    path('prices/<int:price_id>/approve/', views.approve_price, name='approve_price'),
    path('prices/<int:price_id>/reject/', views.reject_price, name='reject_price'),
    path('prices/<int:price_id>/update/', views.update_price, name='update_price'),
    path('prices/<int:price_id>/delete/', views.delete_price, name='delete_price'),
    path('products/<int:product_id>/prices/', views.get_product_prices, name='get_product_prices'),
    
    # ============= PRICE COMPARISON ENDPOINTS =============
    path('products/<int:product_id>/compare/', views.compare_product_prices, name='compare_product_prices'),
    path('products/compare-multiple/', views.compare_multiple_products, name='compare_multiple_products'),
    
    # ============= ADMIN DASHBOARD ENDPOINTS =============
    path('admin/pending-count/', views.get_pending_approvals_count, name='get_pending_approvals_count'),
    path('admin/pending-items/', views.get_all_pending_items, name='get_all_pending_items'),
]