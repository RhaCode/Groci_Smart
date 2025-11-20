"""
Azure Computer Vision OCR Service with OpenAI Parser
backend/receipts/services/ocr_service.py
"""

import os
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
import time
from django.utils import timezone
from django.db import transaction


class AzureOCRService:
    """Service for extracting text from receipt images using Azure Computer Vision"""
    
    def __init__(self):
        self.endpoint = os.getenv('AZURE_COMPUTER_VISION_ENDPOINT')
        self.key = os.getenv('AZURE_COMPUTER_VISION_KEY')
        
        if not self.endpoint or not self.key:
            raise ValueError(
                "Azure Computer Vision credentials not found. "
                "Please set AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY"
            )
        
        self.client = ComputerVisionClient(
            self.endpoint,
            CognitiveServicesCredentials(self.key)
        )
    
    def extract_text_from_image(self, image_path):
        """
        Extract text from an image using Azure OCR Read API
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict: Contains 'text' (extracted text) and 'raw_result' (full API response)
        """
        try:
            # Open the image file
            with open(image_path, 'rb') as image_stream:
                # Call the API to read the image
                read_operation = self.client.read_in_stream(
                    image_stream,
                    raw=True
                )
            
            # Get the operation location (URL with operation ID)
            operation_location = read_operation.headers["Operation-Location"]
            operation_id = operation_location.split("/")[-1]
            
            # Wait for the operation to complete
            max_retries = 10
            retry_count = 0
            while retry_count < max_retries:
                read_result = self.client.get_read_result(operation_id)
                
                if read_result.status not in [
                    OperationStatusCodes.running,
                    OperationStatusCodes.not_started
                ]:
                    break
                
                time.sleep(1)
                retry_count += 1
            
            # Check if operation succeeded
            if read_result.status != OperationStatusCodes.succeeded:
                return {
                    'success': False,
                    'error': f'OCR operation failed with status: {read_result.status}',
                    'text': '',
                    'raw_result': None
                }
            
            # Extract text from results
            extracted_text = []
            if read_result.analyze_result and read_result.analyze_result.read_results:
                for page in read_result.analyze_result.read_results:
                    for line in page.lines:
                        extracted_text.append(line.text)
            
            full_text = '\n'.join(extracted_text)
            
            return {
                'success': True,
                'text': full_text,
                'raw_result': read_result.as_dict(),
                'error': None
            }
            
        except FileNotFoundError:
            return {
                'success': False,
                'error': f'Image file not found: {image_path}',
                'text': '',
                'raw_result': None
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'OCR error: {str(e)}',
                'text': '',
                'raw_result': None
            }
    
    @staticmethod
    def process_receipt_ocr(receipt):
        """
        Process receipt image with OCR and extract data using OpenAI
        
        Args:
            receipt: Receipt model instance
        """
        from receipts.models import ReceiptItem
        from receipts.services.openai_receipt_parser import OpenAIReceiptParser
        from products.models import Store, Product, Category, PriceHistory
        
        receipt.status = 'processing'
        receipt.save()
        
        try:
            # Step 1: Extract text using Azure OCR
            ocr_service = AzureOCRService()
            ocr_result = ocr_service.extract_text_from_image(receipt.receipt_image.path)
            
            if not ocr_result['success']:
                raise Exception(ocr_result['error'])
            
            # Save OCR text
            receipt.ocr_text = ocr_result['text']
            receipt.save()
            
            # Step 2: Parse receipt data using OpenAI
            parser = OpenAIReceiptParser()
            parsed_data = parser.parse_receipt_text(ocr_result['text'])
            
            # Check if it's a valid receipt
            if not parsed_data.get('success') or not parsed_data.get('is_receipt'):
                error_msg = parsed_data.get('error', 'Text does not appear to be a receipt')
                receipt.status = 'failed'
                receipt.processing_error = error_msg
                receipt.save()
                raise Exception(error_msg)
            
            # Step 3: Update receipt with parsed data using transaction
            with transaction.atomic():
                # Update receipt fields
                if parsed_data.get('store_name'):
                    receipt.store_name = parsed_data['store_name']
                if parsed_data.get('store_location'):
                    receipt.store_location = parsed_data['store_location']
                if parsed_data.get('purchase_date'):
                    receipt.purchase_date = parsed_data['purchase_date']
                if parsed_data.get('total_amount'):
                    receipt.total_amount = parsed_data['total_amount']
                if parsed_data.get('tax_amount'):
                    receipt.tax_amount = parsed_data['tax_amount']
                
                receipt.save()
                
                # Step 4: Get or create store
                store = None
                if receipt.store_name:
                    store, created = Store.objects.get_or_create(
                        name=receipt.store_name,
                        defaults={'location': receipt.store_location or ''}
                    )
                
                # Step 5: Create receipt items and products
                if parsed_data.get('items'):
                    for item_data in parsed_data['items']:
                        # Try to find or create the product
                        product = AzureOCRService._get_or_create_product(item_data)
                        
                        # Create receipt item
                        receipt_item = ReceiptItem.objects.create(
                            receipt=receipt,
                            product=product,
                            product_name=item_data['name'],
                            normalized_name=item_data['normalized_name'],
                            quantity=item_data['quantity'],
                            unit_price=item_data['unit_price'],
                            total_price=item_data['total_price']
                        )
                        
                        # Step 6: Update price history if we have a store and product
                        if store and product:
                            PriceHistory.objects.create(
                                product=product,
                                store=store,
                                price=item_data['unit_price'],
                                date_recorded=receipt.purchase_date or timezone.now().date(),
                                source='receipt',
                                is_active=True
                            )
                
                receipt.status = 'completed'
                receipt.save()
            
        except Exception as e:
            receipt.status = 'failed'
            receipt.processing_error = str(e)
            receipt.save()
            raise
    
    @staticmethod
    def _get_or_create_product(item_data):
        """
        Find existing product or create new one from receipt item data
        
        Args:
            item_data: Dict with product information from parsed receipt
            
        Returns:
            Product instance
        """
        from products.models import Product, Category
        
        normalized_name = item_data['normalized_name']
        brand = item_data.get('brand', '')
        
        # Try to find existing product by normalized name and brand
        existing_product = Product.objects.filter(
            normalized_name=normalized_name,
            brand__iexact=brand if brand else ''
        ).first()
        
        if existing_product:
            return existing_product
        
        # Try to find/create category
        category = None
        category_name = item_data.get('category', '')
        if category_name:
            category, _ = Category.objects.get_or_create(
                name=category_name,
                defaults={'description': f'Auto-created from receipt parsing'}
            )
        
        # Create new product
        product = Product.objects.create(
            name=item_data['name'],
            normalized_name=normalized_name,
            brand=brand,
            unit=item_data.get('unit', ''),
            category=category,
            description='Auto-created from receipt',
            is_active=True
        )
        
        return product