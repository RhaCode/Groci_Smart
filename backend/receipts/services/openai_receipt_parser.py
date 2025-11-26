"""
OpenAI-powered Receipt Parser
backend/receipts/services/openai_receipt_parser.py
"""

import os
import json
from openai import OpenAI
from datetime import datetime
from decimal import Decimal


class OpenAIReceiptParser:
    """Service for parsing OCR text from receipts using ChatGPT"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            raise ValueError(
                "OpenAI API key not found. "
                "Please set OPENAI_API_KEY in your environment variables"
            )
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4.1-mini')
    
    def parse_receipt_text(self, text):
        """
        Parse receipt text using ChatGPT and extract structured data
        
        Args:
            text: OCR extracted text from receipt
            
        Returns:
            dict: Parsed receipt data or error information
        """
        if not text or len(text.strip()) < 10:
            return {
                'success': False,
                'error': 'Text is too short or empty',
                'is_receipt': False
            }
        
        try:
            # Create the prompt for ChatGPT
            prompt = self._create_parsing_prompt(text)
            
            # Call ChatGPT API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a receipt parsing assistant. Extract structured data from receipt text and return valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Low temperature for consistent outputs
                response_format={"type": "json_object"}  # Ensure JSON response
            )
            
            # Parse the response
            result_text = response.choices[0].message.content
            parsed_data = json.loads(result_text)
            
            # Validate and transform the data
            validated_data = self._validate_and_transform(parsed_data)
            
            return validated_data
            
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error': f'Failed to parse JSON response: {str(e)}',
                'is_receipt': False
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'ChatGPT parsing error: {str(e)}',
                'is_receipt': False
            }
    
    def _create_parsing_prompt(self, text):
        """Create the prompt for ChatGPT"""
        return f"""Analyze the following text extracted from a receipt image using OCR.

Your task:
1. Determine if this text appears to be from a retail/shopping receipt
2. If it is a receipt, extract ALL the information below
3. Return ONLY valid JSON (no markdown, no explanations)

Extract this information:
- store_name: Name of the store/supermarket
- store_location: City, state, or full address if available
- purchase_date: Date of purchase in YYYY-MM-DD format
- total_amount: Total amount paid (number only, no currency symbols)
- tax_amount: Tax amount if present (number only, no currency symbols)
- items: Array of items purchased, each with:
  - name: Product name (clean, without extra symbols)
  - brand: Brand name if identifiable (can be empty string)
  - quantity: Quantity purchased (default to 1.0 if not clear)
  - unit: Unit of measure (kg, lbs, each, etc.) - can be empty string
  - unit_price: Price per unit (number only)
  - total_price: Total price for this item (number only)
  - category: Suggested category (Groceries, Household, Produce, Dairy, Meat, Bakery, Beverages, etc.)

Rules:
- is_receipt: true if this is a valid receipt, false otherwise
- If is_receipt is false, set all other fields to null/empty and provide a reason
- For items, skip non-product lines (headers, footers, payment info, etc.)
- Prices should be numbers without currency symbols or commas
- Dates must be in YYYY-MM-DD format
- If a field cannot be determined, use null or empty string
- Product names should be cleaned (remove extra spaces, weird characters)
- Use quantity 1.0 if quantity is not explicitly stated

Return JSON in this exact structure:
{{
  "is_receipt": true or false,
  "confidence": "high" or "medium" or "low",
  "reason": "Why this is or isn't a receipt (only if is_receipt is false)",
  "store_name": "string or null",
  "store_location": "string or null",
  "purchase_date": "YYYY-MM-DD or null",
  "total_amount": number or null,
  "tax_amount": number or null,
  "items": [
    {{
      "name": "string",
      "brand": "string or empty",
      "quantity": number,
      "unit": "string or empty",
      "unit_price": number,
      "total_price": number,
      "category": "string or empty"
    }}
  ]
}}

OCR Text to analyze:
{text}"""
    
    def _validate_and_transform(self, parsed_data):
        """Validate and transform the parsed data from ChatGPT"""
        
        # Check if it's a valid receipt
        if not parsed_data.get('is_receipt', False):
            return {
                'success': False,
                'is_receipt': False,
                'error': parsed_data.get('reason', 'Not identified as a receipt'),
                'confidence': parsed_data.get('confidence', 'low')
            }
        
        # Transform dates
        purchase_date = None
        if parsed_data.get('purchase_date'):
            try:
                purchase_date = datetime.strptime(
                    parsed_data['purchase_date'], 
                    '%Y-%m-%d'
                ).date()
            except (ValueError, TypeError):
                purchase_date = None
        
        # Transform amounts to Decimal
        total_amount = None
        if parsed_data.get('total_amount') is not None:
            try:
                total_amount = Decimal(str(parsed_data['total_amount']))
            except (ValueError, TypeError):
                total_amount = Decimal('0.00')
        
        tax_amount = None
        if parsed_data.get('tax_amount') is not None:
            try:
                tax_amount = Decimal(str(parsed_data['tax_amount']))
            except (ValueError, TypeError):
                tax_amount = None
        
        # Transform items
        items = []
        for item_data in parsed_data.get('items', []):
            try:
                item = {
                    'name': item_data.get('name', '').strip(),
                    'normalized_name': item_data.get('name', '').lower().strip(),
                    'brand': item_data.get('brand', '').strip(),
                    'quantity': Decimal(str(item_data.get('quantity', 1.0))),
                    'unit': item_data.get('unit', '').strip(),
                    'unit_price': Decimal(str(item_data.get('unit_price', 0))),
                    'total_price': Decimal(str(item_data.get('total_price', 0))),
                    'category': item_data.get('category', '').strip()
                }
                
                # Skip items with no name or zero prices
                if item['name'] and (item['unit_price'] > 0 or item['total_price'] > 0):
                    # Calculate missing price if possible
                    if item['unit_price'] == 0 and item['quantity'] > 0:
                        item['unit_price'] = item['total_price'] / item['quantity']
                    elif item['total_price'] == 0 and item['unit_price'] > 0:
                        item['total_price'] = item['unit_price'] * item['quantity']
                    
                    items.append(item)
            except (ValueError, TypeError, KeyError) as e:
                # Skip malformed items
                continue
        
        return {
            'success': True,
            'is_receipt': True,
            'confidence': parsed_data.get('confidence', 'medium'),
            'store_name': parsed_data.get('store_name', ''),
            'store_location': parsed_data.get('store_location', ''),
            'purchase_date': purchase_date,
            'total_amount': total_amount,
            'tax_amount': tax_amount,
            'items': items
        }