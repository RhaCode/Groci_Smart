"""
URL Configuration for receipts app
backend/receipts/urls.py
"""

from django.urls import path
from . import views

app_name = 'receipts'

urlpatterns = [
    # Receipt endpoints
    path('', views.get_receipts, name='get_receipts'),
    path('<int:receipt_id>/', views.get_receipt_detail, name='get_receipt_detail'),
    path('upload/', views.upload_receipt, name='upload_receipt'),
    path('<int:receipt_id>/update/', views.update_receipt, name='update_receipt'),
    path('<int:receipt_id>/delete/', views.delete_receipt, name='delete_receipt'),
    path('<int:receipt_id>/reprocess/', views.reprocess_receipt, name='reprocess_receipt'),
    
    # Receipt item endpoints
    path('<int:receipt_id>/items/', views.get_receipt_items, name='get_receipt_items'),
    path('<int:receipt_id>/items/add/', views.add_receipt_item, name='add_receipt_item'),
    path('<int:receipt_id>/items/bulk/', views.add_receipt_items_bulk, name='add_receipt_items_bulk'),
    path('<int:receipt_id>/items/<int:item_id>/update/', views.update_receipt_item, name='update_receipt_item'),
    path('<int:receipt_id>/items/<int:item_id>/delete/', views.delete_receipt_item, name='delete_receipt_item'),
    
    # Statistics endpoints
    path('stats/', views.get_receipt_stats, name='get_receipt_stats'),
    path('stats/monthly/', views.get_spending_by_month, name='get_spending_by_month'),
]