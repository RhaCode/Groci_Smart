"""
Enhanced Receipt parsing service - handles multiple receipt formats
backend/receipts/services/receipt_parser.py
"""

import re
from datetime import datetime
from decimal import Decimal


class ReceiptParser:
    """Service for parsing OCR text from receipts with support for multiple formats"""
    
    def __init__(self):
        # Common store name patterns
        self.store_patterns = [
            r'(?:^|\n)([A-Z][A-Za-z\s&]+(?:SUPERMARKET|STORE|MART|SHOP|MARKET|GROCERY|DEPOT))',
            r'(?:^|\n)([A-Z][A-Z\s&]{3,30})',
        ]
        
        # Enhanced date patterns
        self.date_patterns = [
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',  # DD Mon YYYY
            r'(?:Time|Date):\s*([A-Za-z]+\s+\d{1,2}\s+\d{4})',  # Time: Mon DD YYYY
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',  # DD-MM-YYYY or MM-DD-YYYY
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',  # YYYY-MM-DD
        ]
        
        # Total patterns - case insensitive now
        self.total_patterns = [
            r'(?:^|\n)\s*(?:TOTAL|Total)[:\s]*\$?\s*([0-9,]+(?:[.,]\d{2})?)',
        ]
        
        # Tax patterns - includes GCT, VAT, TAX, GST
        self.tax_patterns = [
            r'(?:^|\n)\s*(?:GCT|TAX|VAT|GST)[:\s]*\$?\s*([0-9,]+(?:[.,]\d{2})?)',
        ]
        
        # Subtotal pattern
        self.subtotal_patterns = [
            r'(?:^|\n)\s*(?:Subtotal|SUBTOTAL)[:\s]*\$?\s*([0-9,]+(?:[.,]\d{2})?)',
        ]
        
        # Category mapping based on keywords
        self.category_keywords = {
            'Produce': ['vegetable', 'fruit', 'lettuce', 'tomato', 'potato', 'onion', 'carrot', 'apple', 'banana', 'orange'],
            'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'],
            'Meat': ['chicken', 'beef', 'pork', 'meat', 'sausage', 'bacon'],
            'Bakery': ['bread', 'cake', 'pastry', 'bun', 'roll'],
            'Beverages': ['juice', 'soda', 'water', 'drink', 'cola', 'tea', 'coffee'],
            'Household': ['soap', 'detergent', 'cleaner', 'tissue', 'paper'],
        }
    
    def parse_receipt_text(self, text):
        """
        Parse receipt text and extract structured data
        Returns format matching OpenAI parser for consistency
        """
        if not text or len(text.strip()) < 10:
            return {
                'success': False,
                'error': 'Text is too short or empty',
                'is_receipt': False,
                'confidence': 'low'
            }
        
        # Check if text looks like a receipt
        if not self._is_likely_receipt(text):
            return {
                'success': False,
                'is_receipt': False,
                'error': 'Text does not appear to be a receipt',
                'confidence': 'low',
                'reason': 'Missing typical receipt elements (store name, total, items)'
            }
        
        # Extract data
        store_name = self.extract_store_name(text)
        store_location = self.extract_store_location(text)
        purchase_date = self.extract_date(text)
        total_amount = self.extract_total(text)
        tax_amount = self.extract_tax(text)
        items = self.extract_items(text)
        
        # Determine confidence based on what we found
        confidence = self._calculate_confidence(
            store_name, purchase_date, total_amount, items
        )
        
        parsed_data = {
            'success': True,
            'is_receipt': True,
            'confidence': confidence,
            'store_name': store_name,
            'store_location': store_location,
            'purchase_date': purchase_date,
            'total_amount': total_amount,
            'tax_amount': tax_amount,
            'items': items
        }
        
        return parsed_data
    
    def _is_likely_receipt(self, text):
        """Check if text looks like a receipt"""
        text_upper = text.upper()
        
        # Look for common receipt indicators
        has_total = 'TOTAL' in text_upper
        has_store = any(keyword in text_upper for keyword in ['STORE', 'MARKET', 'SHOP', 'MART', 'SUPERMARKET'])
        has_prices = bool(re.search(r'\d+[.,]\d{2}', text))
        
        return has_total and (has_store or has_prices)
    
    def _calculate_confidence(self, store_name, purchase_date, total_amount, items):
        """Calculate confidence level based on extracted data"""
        score = 0
        
        if store_name:
            score += 25
        if purchase_date:
            score += 25
        if total_amount and total_amount > 0:
            score += 25
        if items and len(items) > 0:
            score += 25
        
        if score >= 75:
            return 'high'
        elif score >= 50:
            return 'medium'
        else:
            return 'low'
    
    def _guess_category(self, product_name):
        """Guess product category based on name"""
        name_lower = product_name.lower()
        
        for category, keywords in self.category_keywords.items():
            if any(keyword in name_lower for keyword in keywords):
                return category
        
        return 'Groceries'  # Default category
    
    def extract_store_name(self, text):
        """Extract store name from receipt text"""
        lines = text.split('\n')[:5]
        
        for pattern in self.store_patterns:
            for line in lines:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    store_name = match.group(1).strip()
                    store_name = re.sub(r'\s+', ' ', store_name)
                    return store_name
        
        return ''
    
    def extract_store_location(self, text):
        """Extract store location/address from receipt text"""
        lines = text.split('\n')[:15]
        
        for line in lines:
            match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]+(?:\s+[A-Z]+)?)', line)
            if match:
                city = match.group(1)
                state = match.group(2)
                return f"{city}, {state}"
        
        for line in lines:
            if re.search(r'\d+\s+[A-Z]', line) and len(line) > 10:
                return line.strip()
        
        return ''
    
    def extract_date(self, text):
        """Extract purchase date from receipt text"""
        for pattern in self.date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                parsed = self.parse_date_string(date_str)
                if parsed:
                    return parsed
        
        return None
    
    def parse_date_string(self, date_str):
        """Parse date string into datetime.date object"""
        date_formats = [
            '%b %d %Y',   # Mon DD YYYY
            '%B %d %Y',   # Month DD YYYY
            '%d %b %Y',   # DD Mon YYYY
            '%d %B %Y',   # DD Month YYYY
            '%m/%d/%Y',   # MM/DD/YYYY
            '%d/%m/%Y',   # DD/MM/YYYY
            '%Y/%m/%d',   # YYYY/MM/DD
            '%m-%d-%Y',   # MM-DD-YYYY
            '%d-%m-%Y',   # DD-MM-YYYY
            '%Y-%m-%d',   # YYYY-MM-DD
        ]
        
        # Clean up the date string
        date_str = date_str.strip()
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        return None
    
    def extract_total(self, text):
        """Extract total amount from receipt text"""
        for pattern in self.total_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                amount_str = match.group(1).replace(',', '').replace(' ', '')
                try:
                    return Decimal(amount_str)
                except:
                    continue
        
        return None
    
    def extract_tax(self, text):
        """Extract tax amount from receipt text"""
        for pattern in self.tax_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                amount_str = match.group(1).replace(',', '').replace(' ', '')
                try:
                    return Decimal(amount_str)
                except:
                    continue
        
        return None
    
    def extract_items(self, text):
        """Extract line items from receipt text"""
        items = []
        lines = text.split('\n')

        print("Extracted Lines: ", lines)  # Debugging line to check extracted lines
        
        # Find the start of items section (look for DESCRIPTION or QTY headers)
        start_idx = 0
        for i, line in enumerate(lines):
            if 'DESCRIPTION' in line.upper() or 'QTY' in line.upper():
                start_idx = i + 1
                break
        
        # Find the end of items section (look for Subtotal, GCT, Total, etc.)
        end_idx = len(lines)
        for i in range(start_idx, len(lines)):
            line_upper = lines[i].upper().strip()
            if any(keyword in line_upper for keyword in ['SUBTOTAL', 'GCT', 'TOTAL', 'DEBIT', 'CASH', 'PAYMENT']):
                end_idx = i
                break
        
        # Process item lines
        i = start_idx
        while i < end_idx:
            line = lines[i].strip()
            
            # Skip empty lines or separator lines
            if len(line) < 2 or re.match(r'^[=\-\s]+$', line):
                i += 1
                continue
            
            # Try to parse item
            item = self.parse_item_from_receipt(lines, i, end_idx)
            if item:
                items.append(item)
                i += item.pop('lines_consumed', 1)
            else:
                i += 1
        
        print("Parsed Items: ", items)  # Debugging line to check parsed items
        return items
    
    def parse_item_from_receipt(self, lines, current_idx, end_idx):
        """
        Parse items from receipt handling various formats:
        
        Format 1:
        PRODUCT NAME WITH DESCRIPTION
        PRICE
        QTY TOTAL
        
        Format 2:
        PRODUCT NAME
        PRICE QTY TOTAL
        
        Format 3:
        PRODUCT NAME                    QTY AMOUNT
        """
        
        line = lines[current_idx].strip()
        
        # Skip non-product lines
        if not line or len(line) < 3:
            return None
        
        # Skip lines that are clearly not product names
        if re.match(r'^[\d\s\-=]+$', line):
            return None
        
        # Product name should start with letter
        if not re.match(r'^[A-Z0-9]', line):
            return None
        
        # Skip header rows
        if any(keyword in line.upper() for keyword in ['DESCRIPTION', 'QTY', 'AMOUNT', 'PRICE', 'Thank', 'YOU SAVED']):
            return None
        
        # Skip discount lines (they continue from previous item)
        if 'Discount:' in line:
            return None
        
        product_name = line
        
        # Look ahead to find quantity and price information
        quantity = Decimal('1.0')
        unit_price = Decimal('0.00')
        total_price = Decimal('0.00')
        lines_consumed = 1
        
        # Check next few lines for price and quantity
        for offset in range(1, min(4, end_idx - current_idx)):
            next_line = lines[current_idx + offset].strip()
            
            if not next_line or 'Discount' in next_line:
                continue
            
            # Try to extract price and quantity from this line
            # Patterns: "PRICE QTY TOTAL" or "QTY PRICE" or just prices
            
            # Pattern: "2.00 4,802.96G" or "2.00 4,802.96"
            match = re.search(r'(\d+\.?\d*)\s+([0-9,]+\.?\d+)[G]?\s*$', next_line)
            if match:
                quantity = Decimal(match.group(1))
                total_price = Decimal(match.group(2).replace(',', ''))
                unit_price = total_price / quantity if quantity > 0 else total_price
                lines_consumed = offset + 1
                break
            
            # Pattern: "3,048.17" followed by "3.00 9,144.51"
            match = re.search(r'^([0-9,]+\.\d{2})$', next_line)
            if match:
                unit_price = Decimal(next_line.replace(',', ''))
                # Look at next line for qty and total
                if current_idx + offset + 1 < end_idx:
                    qty_line = lines[current_idx + offset + 1].strip()
                    qty_match = re.search(r'(\d+\.?\d*)\s+([0-9,]+\.?\d+)[G]?', qty_line)
                    if qty_match:
                        quantity = Decimal(qty_match.group(1))
                        total_price = Decimal(qty_match.group(2).replace(',', ''))
                        lines_consumed = offset + 2
                        break
        
        # If we couldn't find quantity/price, this might not be a valid item
        if total_price == 0 and unit_price == 0:
            return None
        
        # If unit price is 0, derive it from total and quantity
        if unit_price == 0 and quantity > 0:
            unit_price = total_price / quantity
        
        # If total price is 0, derive it from unit price and quantity
        if total_price == 0:
            total_price = unit_price * quantity
        
        # Try to extract brand from product name (usually first word if ALL CAPS)
        brand = ''
        name_parts = product_name.split()
        if len(name_parts) > 1 and name_parts[0].isupper():
            brand = name_parts[0]
        
        # Guess category
        category = self._guess_category(product_name)
        
        return {
            'name': product_name,
            'normalized_name': product_name.lower().strip(),
            'brand': brand,
            'quantity': quantity,
            'unit': '',  # Unit detection could be improved
            'unit_price': unit_price,
            'total_price': total_price,
            'category': category,
            'lines_consumed': lines_consumed
        }