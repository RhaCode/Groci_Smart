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
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
            r'(?:Time|Date):\s*([A-Za-z]+\s+\d{1,2}\s+\d{4})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',
        ]
        
        # Total patterns
        self.total_patterns = [
            r'(?:^|\n)\s*(?:TOTAL|Total)[:\s]*\$?\s*([0-9,]+(?:[.,]\d{2})?)',
        ]
        
        # Tax patterns
        self.tax_patterns = [
            r'(?:^|\n)\s*(?:GCT|TAX|VAT|GST)[:\s]*\$?\s*([0-9,]+(?:[.,]\d{2})?)',
        ]
        
        # Category mapping
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
        
        return 'Groceries'
    
    def _is_valid_product_name(self, line):
        """
        Determine if a line is likely a product name
        Valid product names should:
        - Start with alphanumeric (usually a letter)
        - Contain at least 3 characters
        - Have some letters (not just numbers)
        - Not be a pure number (like "2,401.48")
        """
        if not line or len(line) < 3:
            return False
        
        # Must start with letter or digit
        if not re.match(r'^[A-Z0-9]', line):
            return False
        
        # Skip pure numbers or mostly numbers
        # e.g., "2,401.48", "1.00", "100.00"
        if re.match(r'^[\d\s,.\-]*$', line):
            return False
        
        # Must have at least one letter
        if not re.search(r'[A-Za-z]', line):
            return False
        
        # Skip known non-product lines
        non_product_keywords = [
            'DESCRIPTION', 'QTY', 'AMOUNT', 'PRICE', 'Thank', 'YOU SAVED',
            'Discount:', 'Subtotal', 'SUBTOTAL', 'TOTAL', 'Total', 'GCT',
            'Change', 'DEBIT', 'CASH', 'CARD', 'PAYMENT', 'Refunds', 'Exchange',
            'TEL', 'INVOICE', 'Closed', 'CASHIER', 'STATION', 'Emp:', 'Reg:',
            'Tax ID', 'Tax Number'
        ]
        
        for keyword in non_product_keywords:
            if keyword in line:
                return False
        
        return True
    
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
            '%b %d %Y', '%B %d %Y', '%d %b %Y', '%d %B %Y',
            '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d',
            '%m-%d-%Y', '%d-%m-%Y', '%Y-%m-%d',
        ]
        
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
        """
        Extract line items from receipt using pattern detection.
        Analyzes the structure to identify where product data starts/ends.
        """
        items = []
        lines = text.split('\n')
        
        # Find section boundaries
        item_section = self._find_item_section(lines)
        if not item_section:
            return items
        
        start_idx, end_idx = item_section
        
        # Analyze price patterns to understand the receipt format
        price_patterns = self._analyze_price_patterns(lines[start_idx:end_idx])
        
        print(f"Detected price pattern: {price_patterns}")
        
        # Extract items based on detected patterns
        i = start_idx
        while i < end_idx:
            line = lines[i].strip()
            
            if len(line) < 2 or re.match(r'^[=\-\s]+$', line):
                i += 1
                continue
            
            if self._is_valid_product_name(line):
                item = self._parse_product_item(lines, i, end_idx, price_patterns)
                if item:
                    items.append(item)
                    i += item.pop('lines_consumed', 1)
                else:
                    i += 1
            else:
                i += 1
        
        print(f"Parsed {len(items)} items")
        return items
    
    def _find_item_section(self, lines):
        """Find start and end indices of the items section"""
        start_idx = 0
        end_idx = len(lines)
        
        # Find start: look for DESCRIPTION, QTY, or first product-like line
        for i, line in enumerate(lines):
            if any(keyword in line.upper() for keyword in ['DESCRIPTION', 'QTY', 'ITEM']):
                start_idx = i + 1
                break
        
        # Find end: look for totals section
        for i in range(start_idx, len(lines)):
            line_upper = lines[i].upper().strip()
            if any(keyword in line_upper for keyword in ['SUBTOTAL', 'GCT', 'TOTAL', 'DEBIT', 'CASH', 'PAYMENT', 'YOU SAVED']):
                end_idx = i
                break
        
        return (start_idx, end_idx) if start_idx < end_idx else None
    
    def _analyze_price_patterns(self, lines):
        """
        Analyze price patterns in the item section to understand format.
        Returns pattern info to guide item parsing.
        """
        pattern_info = {
            'has_qty_price_total': False,
            'has_inline_prices': False,
            'typical_price_count': 0
        }
        
        for line in lines[:20]:  # Sample first 20 lines
            # Count prices in line (pattern: number.number or number,number.number)
            price_matches = re.findall(r'\d+[,.]?\d*[.,]\d{2}', line)
            
            if len(price_matches) >= 2:
                pattern_info['has_inline_prices'] = True
                pattern_info['typical_price_count'] = max(pattern_info['typical_price_count'], len(price_matches))
            
            # Check for qty pattern
            if re.search(r'\d+\.\d{2}\s+\d+', line):
                pattern_info['has_qty_price_total'] = True
        
        return pattern_info
    
    def _parse_product_item(self, lines, current_idx, end_idx, price_patterns):
        """
        Parse a product item, adapting to detected price patterns.
        """
        line = lines[current_idx].strip()
        
        if not self._is_valid_product_name(line):
            return None
        
        product_name = line
        quantity = Decimal('1.0')
        unit_price = Decimal('0.00')
        total_price = Decimal('0.00')
        lines_consumed = 1
        
        # Look ahead for pricing information
        for offset in range(1, min(5, end_idx - current_idx)):
            next_line = lines[current_idx + offset].strip()
            
            if not next_line or 'Discount' in next_line:
                continue
            
            # Skip lines that are clearly product names
            if self._is_valid_product_name(next_line) and offset > 1:
                break
            
            # Try to extract prices from this line
            prices = self._extract_prices_from_line(next_line)
            
            if prices:
                # Pattern: [qty, unit_price, total] or [unit_price, total] or similar
                if len(prices) == 3:
                    # Assume: qty, unit_price, total
                    quantity = prices[0]
                    unit_price = prices[1]
                    total_price = prices[2]
                    lines_consumed = offset + 1
                    break
                elif len(prices) == 2:
                    # Could be [unit_price, total] or [qty, total]
                    # If first is small number (0-100), likely qty
                    if prices[0] < 100:
                        quantity = prices[0]
                        total_price = prices[1]
                        unit_price = total_price / quantity if quantity > 0 else prices[1]
                    else:
                        unit_price = prices[0]
                        total_price = prices[1]
                    lines_consumed = offset + 1
                    break
                elif len(prices) == 1:
                    # Single price - likely unit_price, look for total on next line
                    unit_price = prices[0]
        
        # Validate the item
        if not self._is_valid_item(product_name, quantity, unit_price, total_price):
            return None
        
        # If we only have unit_price, calculate total
        if unit_price > 0 and total_price == 0:
            total_price = unit_price * quantity
        
        # Extract brand (usually first word if all caps and short)
        brand = ''
        name_parts = product_name.split()
        if name_parts and len(name_parts[0]) <= 10 and name_parts[0].isupper():
            brand = name_parts[0]
        
        category = self._guess_category(product_name)
        
        return {
            'name': product_name,
            'normalized_name': product_name.lower().strip(),
            'brand': brand,
            'quantity': quantity,
            'unit': '',
            'unit_price': unit_price,
            'total_price': total_price,
            'category': category,
            'lines_consumed': lines_consumed
        }
    
    def _extract_prices_from_line(self, line):
        """
        Extract decimal prices from a line.
        Returns list of Decimal values found.
        """
        prices = []
        
        # Find all price-like patterns (number.number or number,number.number)
        pattern = r'(\d+[,.]?\d*[.,]\d{2})'
        matches = re.findall(pattern, line)
        
        for match in matches:
            try:
                # Clean up the price string
                clean = match.replace(',', '').replace(' ', '')
                price = Decimal(clean)
                prices.append(price)
            except:
                pass
        
        return prices
    
    def _is_valid_item(self, product_name, quantity, unit_price, total_price):
        """
        Validate that extracted item makes sense.
        Filters out nonsensical entries like "2,401.48" as product name.
        """
        # Product name must have letters
        if not re.search(r'[A-Za-z]', product_name):
            return False
        
        # Product name should not be mostly numbers
        letter_ratio = len(re.findall(r'[A-Za-z]', product_name)) / len(product_name)
        if letter_ratio < 0.3:
            return False
        
        # At least one price must be reasonable (not 0)
        if unit_price == 0 and total_price == 0:
            return False
        
        # Quantity should be reasonable (not negative, not absurdly large)
        if quantity <= 0 or quantity > 10000:
            return False
        
        # Price should be reasonable (typically under 10000)
        if unit_price > 10000 or total_price > 100000:
            return False
        
        return True