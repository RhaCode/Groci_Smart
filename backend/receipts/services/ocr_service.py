"""
Azure Computer Vision OCR Service with OpenAI Parser and Fallback
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
    def _is_openai_configured():
        """Check if OpenAI is properly configured"""
        api_key = os.getenv('OPENAI_API_KEY')
        return api_key is not None and len(api_key.strip()) > 0
    
    @staticmethod
    def _parse_receipt_with_fallback(ocr_text):
        """
        Parse receipt text using OpenAI if configured, otherwise fall back to manual parser
        
        Args:
            ocr_text: OCR extracted text from receipt
            
        Returns:
            dict: Parsed receipt data
        """
        # Try OpenAI first if configured
        if AzureOCRService._is_openai_configured():
            try:
                from receipts.services.openai_receipt_parser import OpenAIReceiptParser
                
                print("Using OpenAI parser...")
                parser = OpenAIReceiptParser()
                parsed_data = parser.parse_receipt_text(ocr_text)
                
                # If OpenAI parsing was successful, return it
                if parsed_data.get('success'):
                    print(f"OpenAI parsing successful (confidence: {parsed_data.get('confidence')})")
                    return parsed_data
                else:
                    print(f"OpenAI parsing failed: {parsed_data.get('error')}")
                    # Fall through to manual parser
                    
            except ImportError:
                print("OpenAI parser module not available, falling back to manual parser")
            except Exception as e:
                print(f"OpenAI parser error: {str(e)}, falling back to manual parser")
        else:
            print("OpenAI not configured, using manual parser")
        
        # Fall back to manual parser
        try:
            from receipts.services.receipt_parser import ReceiptParser
            
            print("Using manual receipt parser...")
            parser = ReceiptParser()
            parsed_data = parser.parse_receipt_text(ocr_text)
            
            print(f"Manual parsing result: success={parsed_data.get('success')}, "
                  f"confidence={parsed_data.get('confidence')}, "
                  f"items={len(parsed_data.get('items', []))}")
            
            return parsed_data
            
        except Exception as e:
            print(f"Manual parser error: {str(e)}")
            return {
                'success': False,
                'is_receipt': False,
                'error': f'All parsers failed: {str(e)}',
                'confidence': 'low'
            }
    
    @staticmethod
    def process_receipt_ocr(receipt):
        """
        Process receipt image with OCR and extract data using OpenAI or fallback parser
        
        Args:
            receipt: Receipt model instance
        """
        from receipts.models import ReceiptItem
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
            
            # Step 2: Parse receipt data using OpenAI or fallback to manual parser
            parsed_data = AzureOCRService._parse_receipt_with_fallback(ocr_result['text'])
            
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
                if parsed_data.get('total_amount') is not None:
                    receipt.total_amount = parsed_data['total_amount']
                if parsed_data.get('tax_amount') is not None:
                    receipt.tax_amount = parsed_data['tax_amount']
                
                receipt.save()
                
                # Step 4: Get or create store
                store = None
                if receipt.store_name:
                    store, created = Store.objects.get_or_create(
                        name=receipt.store_name,
                        defaults={'location': receipt.store_location or ''}
                    )
                    if created:
                        print(f"Created new store: {store.name}")
                
                # Step 5: Create receipt items and products
                items_created = 0
                if parsed_data.get('items'):
                    for item_data in parsed_data['items']:
                        # Try to find or create the product
                        product = AzureOCRService._get_or_create_product(item_data)
                        
                        # Create receipt item
                        receipt_item = ReceiptItem.objects.create(
                            receipt=receipt,
                            product=product,
                            product_name=item_data['name'],
                            normalized_name=item_data.get('normalized_name', item_data['name'].lower()),
                            quantity=item_data['quantity'],
                            unit_price=item_data['unit_price'],
                            total_price=item_data['total_price']
                        )
                        items_created += 1
                        
                        # Step 6: Update price history if we have a store and product
                        if store and product:
                            PriceHistory.objects.update_or_create(
                                product=product,
                                store=store,
                                date_recorded=receipt.purchase_date or timezone.now().date(),
                                defaults={
                                    'price': item_data['unit_price'],
                                    'source': 'receipt',
                                    'is_active': True
                                }
                            )
                
                print(f"Created {items_created} receipt items")
                
                receipt.status = 'completed'
                receipt.processing_note = f"Parsed with {parsed_data.get('confidence', 'unknown')} confidence"
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
        
        normalized_name = item_data.get('normalized_name', item_data['name'].lower())
        brand = item_data.get('brand', '')
        
        # Try to find existing product by normalized name and brand
        query = Product.objects.filter(normalized_name=normalized_name)
        if brand:
            query = query.filter(brand__iexact=brand)
        
        existing_product = query.first()
        
        if existing_product:
            print(f"Found existing product: {existing_product.name}")
            return existing_product
        
        # Try to find/create category
        category = None
        category_name = item_data.get('category', '')
        if category_name:
            category, created = Category.objects.get_or_create(
                name=category_name,
                defaults={'description': f'Auto-created from receipt parsing'}
            )
            if created:
                print(f"Created new category: {category.name}")
        
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
        
        print(f"Created new product: {product.name}")
        return product