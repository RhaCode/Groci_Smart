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
    def process_receipt_ocr(receipt, extract_text=True):
        """
        Process receipt with OCR and extract data.
        
        Args:
            receipt: Receipt model instance
            extract_text: If True, extract text from image. If False, use already extracted text.
        """
        from receipts.models import ReceiptItem
        from products.models import Store, Product, Category, PriceHistory
        
        receipt.status = 'processing'
        receipt.save()
        
        try:
            # Step 1: Extract text using Azure OCR (only if extract_text is True)
            if extract_text:
                ocr_service = AzureOCRService()
                ocr_result = ocr_service.extract_text_from_image(receipt.receipt_image.path)
                
                if not ocr_result['success']:
                    raise Exception(ocr_result['error'])
                
                # Save OCR text
                receipt.ocr_text = ocr_result['text']
                receipt.save()
            else:
                # Use already extracted text for reprocessing
                if not receipt.ocr_text:
                    raise Exception('No OCR text available for reprocessing')
            
            # Step 2: Parse receipt data using OpenAI or fallback to manual parser
            parsed_data = AzureOCRService._parse_receipt_with_fallback(receipt.ocr_text)
            
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
                # Stores created from receipts need approval unless created by staff
                store = None
                if receipt.store_name:
                    store = AzureOCRService._get_or_create_store(
                        receipt.store_name,
                        receipt.store_location or '',
                        receipt.user
                    )
                    print(f"Store: {store.name} (approved: {store.is_approved})")
                
                # Step 5: Create receipt items and products
                items_created = 0
                if parsed_data.get('items'):
                    for item_data in parsed_data['items']:
                        # Try to find or create the product
                        # Products created from receipts need approval unless user is staff
                        product = AzureOCRService._get_or_create_product(
                            item_data,
                            receipt.user
                        )
                        
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
                        # Prices created from receipts need approval unless user is staff
                        if store and product:
                            is_staff = receipt.user.is_staff if receipt.user else False
                            
                            price_history, created = PriceHistory.objects.update_or_create(
                                product=product,
                                store=store,
                                date_recorded=receipt.purchase_date or timezone.now().date(),
                                defaults={
                                    'price': item_data['unit_price'],
                                    'source': 'receipt',
                                    'is_active': is_staff,  # Only active if created by staff
                                    'is_approved': is_staff,  # Only approved if created by staff
                                    'created_by': receipt.user
                                }
                            )
                            
                            if created:
                                print(f"Created price: ${item_data['unit_price']} for {product.name} at {store.name} (approved: {price_history.is_approved})")
                            else:
                                print(f"Updated price: ${item_data['unit_price']} for {product.name} at {store.name}")
                
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
    def _get_or_create_store(store_name, store_location, user):
        """
        Find existing approved store or create new one pending approval
        
        Args:
            store_name: Store name from receipt
            store_location: Store location from receipt
            user: User who uploaded the receipt
            
        Returns:
            Store instance
        """
        from products.models import Store
        
        # Try to find existing approved store by name
        existing_store = Store.objects.filter(
            name__iexact=store_name,
            is_approved=True
        ).first()
        
        if existing_store:
            print(f"Found existing approved store: {existing_store.name}")
            return existing_store
        
        # Check if user already created this store (pending approval)
        user_pending_store = Store.objects.filter(
            name__iexact=store_name,
            created_by=user,
            is_approved=False
        ).first()
        
        if user_pending_store:
            print(f"Found user's pending store: {user_pending_store.name}")
            return user_pending_store
        
        # Create new store - auto-approved if user is staff
        is_staff = user.is_staff if user else False
        
        store = Store.objects.create(
            name=store_name,
            location=store_location,
            created_by=user,
            is_approved=is_staff,
            is_active=True
        )
        
        if is_staff:
            print(f"Created new auto-approved store: {store.name}")
        else:
            print(f"Created new store pending approval: {store.name}")
        
        return store
    
    @staticmethod
    def _get_or_create_product(item_data, user):
        """
        Find existing approved product or create new one pending approval
        
        Args:
            item_data: Dict with product information from parsed receipt
            user: User who uploaded the receipt
            
        Returns:
            Product instance
        """
        from products.models import Product, Category
        
        normalized_name = item_data.get('normalized_name', item_data['name'].lower())
        brand = item_data.get('brand', '')
        
        # Try to find existing approved product by normalized name and brand
        query = Product.objects.filter(
            normalized_name=normalized_name,
            is_approved=True
        )
        if brand:
            query = query.filter(brand__iexact=brand)
        
        existing_product = query.first()
        
        if existing_product:
            print(f"Found existing approved product: {existing_product.name}")
            return existing_product
        
        # Check if user already created this product (pending approval)
        user_query = Product.objects.filter(
            normalized_name=normalized_name,
            created_by=user,
            is_approved=False
        )
        if brand:
            user_query = user_query.filter(brand__iexact=brand)
        
        user_pending_product = user_query.first()
        
        if user_pending_product:
            print(f"Found user's pending product: {user_pending_product.name}")
            return user_pending_product
        
        # Try to find/create category
        category = None
        category_name = item_data.get('category', '')
        if category_name:
            category = AzureOCRService._get_or_create_category(category_name, user)
        
        # Create new product - auto-approved if user is staff
        is_staff = user.is_staff if user else False
        
        product = Product.objects.create(
            name=item_data['name'],
            normalized_name=normalized_name,
            brand=brand,
            unit=item_data.get('unit', ''),
            category=category,
            description='Auto-created from receipt',
            is_active=True,
            is_approved=is_staff,
            created_by=user
        )
        
        if is_staff:
            print(f"Created new auto-approved product: {product.name}")
        else:
            print(f"Created new product pending approval: {product.name}")
        
        return product
    
    @staticmethod
    def _get_or_create_category(category_name, user):
        """
        Find existing approved category or create new one pending approval
        
        Args:
            category_name: Category name from parsed receipt
            user: User who uploaded the receipt
            
        Returns:
            Category instance or None
        """
        from products.models import Category
        
        # Try to find existing approved category
        existing_category = Category.objects.filter(
            name__iexact=category_name,
            is_approved=True
        ).first()
        
        if existing_category:
            print(f"Found existing approved category: {existing_category.name}")
            return existing_category
        
        # Check if user already created this category (pending approval)
        user_pending_category = Category.objects.filter(
            name__iexact=category_name,
            created_by=user,
            is_approved=False
        ).first()
        
        if user_pending_category:
            print(f"Found user's pending category: {user_pending_category.name}")
            return user_pending_category
        
        # Create new category - auto-approved if user is staff
        is_staff = user.is_staff if user else False
        
        category = Category.objects.create(
            name=category_name,
            description='Auto-created from receipt parsing',
            is_approved=is_staff,
            created_by=user
        )
        
        if is_staff:
            print(f"Created new auto-approved category: {category.name}")
        else:
            print(f"Created new category pending approval: {category.name}")
        
        return category