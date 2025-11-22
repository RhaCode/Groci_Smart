"""
Views for receipts app
backend/receipts/views.py
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
import os
from .models import Receipt, ReceiptItem
from .serializers import (
    ReceiptSerializer,
    ReceiptListSerializer,
    ReceiptUploadSerializer,
    ReceiptUpdateSerializer,
    ReceiptItemSerializer,
    ReceiptItemUpdateSerializer,
    ReceiptItemCreateSerializer,
    AddReceiptItemsSerializer,
)
from .services.ocr_service import AzureOCRService


# ===================== RECEIPT VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_receipts(request):
    """Get all receipts for current user with pagination"""
    receipts = Receipt.objects.filter(user=request.user).prefetch_related('items')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    if status_filter:
        receipts = receipts.filter(status=status_filter)
    
    store_name = request.query_params.get('store')
    if store_name:
        receipts = receipts.filter(store_name__icontains=store_name)
    
    # Date range filter
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    if start_date:
        receipts = receipts.filter(purchase_date__gte=start_date)
    if end_date:
        receipts = receipts.filter(purchase_date__lte=end_date)
    
    # Pagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(receipts, request)
    serializer = ReceiptListSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_receipt_detail(request, receipt_id):
    """Get detailed information about a receipt"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    serializer = ReceiptSerializer(receipt, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_receipt(request):
    """Upload a new receipt image"""
    serializer = ReceiptUploadSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        receipt = serializer.save()
        
        # Trigger OCR processing with text extraction
        try:
            AzureOCRService.process_receipt_ocr(receipt, extract_text=True)
        except Exception as e:
            receipt.status = 'failed'
            receipt.processing_error = str(e)
            receipt.save()
        
        return Response(
            ReceiptSerializer(receipt, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reprocess_receipt(request, receipt_id):
    """Reprocess receipt using already extracted OCR text"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    
    try:
        # Clear existing items before reprocessing
        receipt.items.all().delete()
        
        receipt.status = 'processing'
        receipt.processing_error = ''
        receipt.save()
        
        # Reprocess without extracting text (uses existing ocr_text)
        AzureOCRService.process_receipt_ocr(receipt, extract_text=False)
        
        return Response(
            ReceiptSerializer(receipt, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
    except Exception as e:
        receipt.status = 'failed'
        receipt.processing_error = str(e)
        receipt.save()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_receipt(request, receipt_id):
    """Update receipt information"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    serializer = ReceiptUpdateSerializer(receipt, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(ReceiptSerializer(receipt, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_receipt(request, receipt_id):
    """Delete a receipt"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    
    # Delete the image file
    if receipt.receipt_image:
        if os.path.isfile(receipt.receipt_image.path):
            os.remove(receipt.receipt_image.path)
    
    receipt.delete()
    return Response({'message': 'Receipt deleted successfully'}, status=status.HTTP_200_OK)

# ===================== RECEIPT ITEM VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_receipt_items(request, receipt_id):
    """Get all items for a receipt"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    items = receipt.items.all()
    serializer = ReceiptItemSerializer(items, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_receipt_item(request, receipt_id):
    """Add a single item to a receipt"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    
    serializer = ReceiptItemCreateSerializer(data=request.data)
    if serializer.is_valid():
        item = serializer.save(receipt=receipt)
        
        # Recalculate receipt total
        receipt.calculate_total()
        
        return Response(
            ReceiptItemSerializer(item).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_receipt_items_bulk(request, receipt_id):
    """Add multiple items to a receipt"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    
    serializer = AddReceiptItemsSerializer(data=request.data)
    if serializer.is_valid():
        items_data = serializer.validated_data['items']
        created_items = []
        
        for item_data in items_data:
            item = ReceiptItem.objects.create(receipt=receipt, **item_data)
            created_items.append(item)
        
        # Recalculate receipt total
        receipt.calculate_total()
        
        return Response(
            ReceiptItemSerializer(created_items, many=True).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_receipt_item(request, receipt_id, item_id):
    """Update a receipt item"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    item = get_object_or_404(ReceiptItem, id=item_id, receipt=receipt)
    
    serializer = ReceiptItemUpdateSerializer(item, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        
        # Recalculate receipt total
        receipt.calculate_total()
        
        return Response(ReceiptItemSerializer(item).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_receipt_item(request, receipt_id, item_id):
    """Delete a receipt item"""
    receipt = get_object_or_404(Receipt, id=receipt_id, user=request.user)
    item = get_object_or_404(ReceiptItem, id=item_id, receipt=receipt)
    
    item.delete()
    
    # Recalculate receipt total
    receipt.calculate_total()
    
    return Response({'message': 'Item deleted successfully'}, status=status.HTTP_200_OK)


# ===================== STATISTICS VIEWS =====================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_receipt_stats(request):
    """Get receipt statistics for current user"""
    user = request.user
    
    # Get all receipts
    all_receipts = Receipt.objects.filter(user=user, status='completed')
    
    # Calculate totals
    total_receipts = all_receipts.count()
    total_spent = all_receipts.aggregate(total=Sum('total_amount'))['total'] or 0
    
    # This month statistics
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_receipts = all_receipts.filter(purchase_date__gte=month_start)
    receipts_this_month = month_receipts.count()
    spent_this_month = month_receipts.aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Top stores
    top_stores = all_receipts.values('store_name').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    ).order_by('-total')[:5]
    
    top_stores_data = [
        {
            'store_name': store['store_name'],
            'receipt_count': store['count'],
            'total_spent': float(store['total'])
        }
        for store in top_stores
    ]
    
    # Recent receipts
    recent_receipts = all_receipts.order_by('-purchase_date')[:5]
    
    stats_data = {
        'total_receipts': total_receipts,
        'total_spent': float(total_spent),
        'receipts_this_month': receipts_this_month,
        'spent_this_month': float(spent_this_month),
        'top_stores': top_stores_data,
        'recent_receipts': ReceiptListSerializer(
            recent_receipts, 
            many=True, 
            context={'request': request}
        ).data
    }
    
    return Response(stats_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_spending_by_month(request):
    """Get spending grouped by month"""
    user = request.user
    
    # Get receipts from last 12 months
    twelve_months_ago = timezone.now() - timedelta(days=365)
    receipts = Receipt.objects.filter(
        user=user,
        status='completed',
        purchase_date__gte=twelve_months_ago
    )
    
    # Group by month
    monthly_data = {}
    for receipt in receipts:
        if receipt.purchase_date:
            month_key = receipt.purchase_date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'month': month_key,
                    'total': 0,
                    'count': 0
                }
            monthly_data[month_key]['total'] += float(receipt.total_amount)
            monthly_data[month_key]['count'] += 1
    
    # Sort by month
    sorted_data = sorted(monthly_data.values(), key=lambda x: x['month'])
    
    return Response(sorted_data)
