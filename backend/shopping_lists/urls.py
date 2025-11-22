"""
URL Configuration for shopping_lists app
backend/shopping_lists/urls.py
"""

from django.urls import path
from . import views

app_name = 'shopping_lists'

urlpatterns = [
    # Shopping list endpoints
    path('', views.get_shopping_lists, name='get_shopping_lists'),
    path('<int:list_id>/', views.get_shopping_list_detail, name='get_shopping_list_detail'),
    path('create/', views.create_shopping_list, name='create_shopping_list'),
    path('<int:list_id>/update/', views.update_shopping_list, name='update_shopping_list'),
    path('<int:list_id>/delete/', views.delete_shopping_list, name='delete_shopping_list'),
    path('<int:list_id>/duplicate/', views.duplicate_shopping_list, name='duplicate_shopping_list'),
    
    # Shopping list item endpoints
    path('<int:list_id>/items/', views.get_list_items, name='get_list_items'),
    path('<int:list_id>/items/add/', views.add_list_item, name='add_list_item'),
    path('<int:list_id>/items/<int:item_id>/', views.get_list_item, name='get_list_item'),
    path('<int:list_id>/items/bulk/', views.add_list_items_bulk, name='add_list_items_bulk'),
    path('<int:list_id>/items/<int:item_id>/update/', views.update_list_item, name='update_list_item'),
    path('<int:list_id>/items/<int:item_id>/delete/', views.delete_list_item, name='delete_list_item'),
    path('<int:list_id>/items/<int:item_id>/toggle/', views.toggle_item_checked, name='toggle_item_checked'),
    path('<int:list_id>/items/clear-checked/', views.clear_checked_items, name='clear_checked_items'),
    path('<int:list_id>/items/reorder/', views.reorder_items, name='reorder_items'),
    
    # Special features
    path('generate-from-receipt/', views.generate_list_from_receipt, name='generate_list_from_receipt'),
    path('<int:list_id>/compare-prices/', views.compare_list_prices, name='compare_list_prices'),
    path('<int:list_id>/auto-estimate/', views.auto_estimate_prices, name='auto_estimate_prices'),
]
