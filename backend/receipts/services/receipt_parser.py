"""
Universal Receipt parser - handles diverse receipt formats with robust pattern detection
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
        
        # Enhanced date patterns with time support
        self.date_patterns = [
            r'(?:DATE|TIME|Date|Time)[:\s]+([A-Za-z]+\s+\d{1,2}\s+\d{4})',
            r'(?:DATE|TIME|Date|Time)[:\s]+(\d{1,2}/\d{1,2}/\d{4})\s+\d{1,2}:\d{2}',
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',
        ]
        
        # Expanded total patterns
        self.total_patterns = [
            r'(?:^|\n)\s*(?:TOTAL\s+SALES|GRAND\s+TOTAL|TOTAL)[:\s]*\$?\s*([0-9¥.,]+)',
        ]
        
        # Expanded tax patterns
        self.tax_patterns = [
            r'(?:^|\n)\s*(?:GCT|TAX|VAT|GST|Tax\s+\d)[:\s]*\$?\s*([0-9.,]+)',
        ]
        
        # Category mapping
        self.category_keywords = {
            'Produce': ['vegetable', 'fruit', 'lettuce', 'tomato', 'potato', 'onion', 'carrot', 'apple', 'banana', 'orange'],
            'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'],
            'Meat': ['chicken', 'beef', 'pork', 'meat', 'sausage', 'bacon', 'corned', 'beef'],
            'Bakery': ['bread', 'cake', 'pastry', 'bun', 'roll'],
            'Beverages': ['juice', 'soda', 'water', 'drink', 'cola', 'tea', 'coffee'],
            'Household': ['soap', 'detergent', 'cleaner', 'tissue', 'paper', 'bag'],
            'Snacks': ['chip', 'cashew', 'puff', 'cracker', 'nibble'],
            'Condiments': ['sauce', 'seasoning', 'margarine', 'salt', 'sugar'],
        }
    
    def parse_receipt_text(self, text):
        """Parse receipt text and extract structured data"""
        if not text or len(text.strip()) < 10:
            return {
                'success': False,
                'error': 'Text is too short or empty',
                'is_receipt': False,
                'confidence': 'low'
            }
        
        if not self._is_likely_receipt(text):
            return {
                'success': False,
                'is_receipt': False,
                'error': 'Text does not appear to be a receipt',
                'confidence': 'low',
            }
        
        store_name = self.extract_store_name(text)
        store_location = self.extract_store_location(text)
        purchase_date = self.extract_date(text)
        total_amount = self.extract_total(text)
        tax_amount = self.extract_tax(text)
        items = self.extract_items(text)
        
        confidence = self._calculate_confidence(store_name, purchase_date, total_amount, items)
        
        return {
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
    
    def _is_likely_receipt(self, text):
        """Check if text looks like a receipt"""
        text_upper = text.upper()
        has_total = any(kw in text_upper for kw in ['TOTAL', 'GRAND'])
        has_store = any(kw in text_upper for kw in ['STORE', 'MARKET', 'SHOP', 'MART', 'SUPERMARKET'])
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
        """Determine if a line is likely a product name"""
        if not line or len(line) < 2:
            return False
        
        if not re.match(r'^[A-Z0-9¥]', line):
            return False
        
        if re.match(r'^[\d\s,.\-¥]*$', line):
            return False
        
        if not re.search(r'[A-Za-z]', line):
            return False
        
        non_product_keywords = [
            'DESCRIPTION', 'QTY', 'AMOUNT', 'PRICE', 'Thank', 'YOU SAVED',
            'Discount:', 'Subtotal', 'SUBTOTAL', 'TOTAL', 'Total', 'GCT', 'GRAND',
            'Change', 'DEBIT', 'CASH', 'CARD', 'PAYMENT', 'Refunds', 'Exchange',
            'TEL', 'INVOICE', 'Closed', 'CASHIER', 'STATION', 'Emp:', 'Reg:',
            'Tax ID', 'Tax Number', 'Net Sales', 'SALES', 'ITEM COUNT'
        ]
        
        for keyword in non_product_keywords:
            if keyword in line:
                return False
        
        return True
    
    def extract_store_name(self, text):
        """Extract store name from receipt text"""
        lines = text.split('\n')[:8]
        
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
            match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]*(?:\s+[A-Z][a-z]*)*)', line)
            if match:
                city = match.group(1).strip()
                state = match.group(2).strip()
                location = f"{city}, {state}"
                if len(location) > 5:
                    return location
        
        for line in lines:
            if re.search(r'^\d+\s+[A-Z]', line) and len(line) > 10:
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
    
    def _normalize_amount_string(self, amount_str):
        """Normalize amount string handling different locale formats"""
        amount_str = amount_str.replace(' ', '').replace('¥', '').strip()
        
        comma_count = amount_str.count(',')
        period_count = amount_str.count('.')
        
        if comma_count == 0 and period_count == 0:
            return amount_str
        
        if comma_count == 0 and period_count == 1:
            return amount_str
        
        if comma_count == 1 and period_count == 0:
            if amount_str.endswith(',') or len(amount_str.split(',')[1]) == 2:
                return amount_str.replace(',', '.')
            else:
                return amount_str.replace(',', '')
        
        if comma_count > 0 and period_count > 0:
            last_comma = amount_str.rfind(',')
            last_period = amount_str.rfind('.')
            
            if last_period > last_comma:
                return amount_str.replace(',', '')
            else:
                return amount_str.replace('.', '').replace(',', '.')
        
        if period_count > 1:
            parts = amount_str.split('.')
            return ''.join(parts[:-1]) + '.' + parts[-1]
        
        return amount_str
    
    def extract_total(self, text):
        """Extract total amount from receipt text"""
        for pattern in self.total_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                amount_str = match.group(1)
                normalized = self._normalize_amount_string(amount_str)
                try:
                    return Decimal(normalized)
                except:
                    continue
        return None
    
    def extract_tax(self, text):
        """Extract tax amount from receipt text"""
        for pattern in self.tax_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                amount_str = match.group(1)
                normalized = self._normalize_amount_string(amount_str)
                try:
                    return Decimal(normalized)
                except:
                    continue
        return None
    
    def extract_items(self, text):
        """Extract line items from receipt using intelligent pattern detection"""
        items = []
        lines = text.split('\n')
        
        item_section = self._find_item_section(lines)
        if not item_section:
            return items
        
        start_idx, end_idx = item_section
        
        # Try different parsing strategies based on receipt layout
        items = self._extract_items_intelligent(lines, start_idx, end_idx)
        
        return items
    
    def _find_item_section(self, lines):
        """Find start and end indices of the items section"""
        start_idx = 0
        end_idx = len(lines)
        
        # Look for section headers
        for i, line in enumerate(lines):
            if any(kw in line.upper() for kw in ['DESCRIPTION', 'QTY', 'ITEM', '=====']):
                start_idx = i + 1
                break
        
        # Find end at totals section
        for i in range(start_idx, len(lines)):
            line_upper = lines[i].upper().strip()
            if any(kw in line_upper for kw in ['SUBTOTAL', 'GCT', 'TOTAL', 'DEBIT', 'CASH', 'PAYMENT', 'YOU SAVED', 'NET SALES', 'GRAND']):
                end_idx = i
                break
        
        return (start_idx, end_idx) if start_idx < end_idx else None
    
    def _extract_items_intelligent(self, lines, start_idx, end_idx):
        """Extract items using adaptive strategy based on layout patterns"""
        items = []
        i = start_idx
        
        # Detect layout type by sampling
        layout_type = self._detect_layout_type(lines[start_idx:min(start_idx + 20, end_idx)])
        
        while i < end_idx:
            line = lines[i].strip()
            
            if len(line) < 2 or re.match(r'^[=\-\s]+$', line):
                i += 1
                continue
            
            if self._is_valid_product_name(line):
                item = self._parse_item_by_layout(lines, i, end_idx, layout_type)
                if item:
                    items.append(item)
                    i += item.pop('lines_consumed', 1)
                else:
                    i += 1
            else:
                i += 1
        
        return items
    
    def _detect_layout_type(self, sample_lines):
        """Detect receipt layout type: 'inline', 'multiline', or 'at_price'"""
        inline_count = 0
        at_price_count = 0
        
        for line in sample_lines:
            if ' @ ' in line or ' @ $' in line:
                at_price_count += 1
            prices = re.findall(r'\d+[,.]?\d*[.,]\d{2}', line)
            if len(prices) >= 2:
                inline_count += 1
        
        if at_price_count > 2:
            return 'at_price'
        elif inline_count > len(sample_lines) * 0.3:
            return 'inline'
        else:
            return 'multiline'
    
    def _parse_item_by_layout(self, lines, current_idx, end_idx, layout_type):
        """Parse item based on detected layout type"""
        line = lines[current_idx].strip()
        
        if not self._is_valid_product_name(line):
            return None
        
        product_name = line
        quantity = Decimal('1.0')
        unit_price = Decimal('0.00')
        total_price = Decimal('0.00')
        lines_consumed = 1
        
        if layout_type == 'at_price':
            # Handle "ITEM @ $price each" format
            at_match = re.search(r'\s@\s*\$?([0-9.,]+)\s*each', product_name, re.IGNORECASE)
            if at_match:
                unit_price = Decimal(self._normalize_amount_string(at_match.group(1)))
                # Remove @ price from product name
                product_name = re.sub(r'\s@\s*\$?[0-9.,]+\s*each', '', product_name, flags=re.IGNORECASE).strip()
        
        # Look ahead for additional pricing info
        for offset in range(1, min(5, end_idx - current_idx)):
            next_line = lines[current_idx + offset].strip()
            
            if not next_line or 'Discount' in next_line:
                continue
            
            if self._is_valid_product_name(next_line) and offset > 1:
                break
            
            # Extract quantity if line starts with qty pattern
            qty_match = re.match(r'^(\d+(?:[.,]\d+)?)\s+', next_line)
            if qty_match:
                try:
                    quantity = Decimal(self._normalize_amount_string(qty_match.group(1)))
                except:
                    pass
            
            prices = self._extract_prices_from_line(next_line)
            
            if prices:
                if len(prices) >= 2:
                    if prices[0] < 100 and quantity == Decimal('1.0'):
                        quantity = prices[0]
                        if len(prices) >= 3:
                            unit_price = prices[1]
                            total_price = prices[2]
                        else:
                            total_price = prices[1]
                            unit_price = total_price / quantity if quantity > 0 else prices[1]
                    else:
                        unit_price = prices[0]
                        total_price = prices[1] if len(prices) > 1 else prices[0]
                    lines_consumed = offset + 1
                    break
                elif len(prices) == 1 and layout_type != 'at_price':
                    if unit_price == 0:
                        unit_price = prices[0]
        
        # Validate and finalize
        if not self._is_valid_item(product_name, quantity, unit_price, total_price):
            return None
        
        if unit_price > 0 and total_price == 0:
            total_price = unit_price * quantity
        if unit_price == 0 and total_price > 0:
            unit_price = total_price / quantity if quantity > 0 else Decimal('0.00')
        
        brand = ''
        name_parts = product_name.split()
        if name_parts and len(name_parts[0]) <= 10 and name_parts[0].isupper():
            brand = name_parts[0]
        
        return {
            'name': product_name,
            'normalized_name': product_name.lower().strip(),
            'brand': brand,
            'quantity': quantity,
            'unit': '',
            'unit_price': unit_price,
            'total_price': total_price,
            'category': self._guess_category(product_name),
            'lines_consumed': lines_consumed
        }
    
    def _extract_prices_from_line(self, line):
        """Extract decimal prices from a line"""
        prices = []
        pattern = r'(\d+[,.]?\d*[.,]\d{2})'
        matches = re.findall(pattern, line)
        
        for match in matches:
            try:
                normalized = self._normalize_amount_string(match)
                price = Decimal(normalized)
                prices.append(price)
            except:
                pass
        
        return prices
    
    def _is_valid_item(self, product_name, quantity, unit_price, total_price):
        """Validate that extracted item makes sense"""
        if not re.search(r'[A-Za-z]', product_name):
            return False
        
        letter_ratio = len(re.findall(r'[A-Za-z]', product_name)) / max(len(product_name), 1)
        if letter_ratio < 0.25:
            return False
        
        if unit_price == 0 and total_price == 0:
            return False
        
        if quantity <= 0 or quantity > 10000:
            return False
        
        if unit_price > 100000 or total_price > 1000000:
            return False
        
        return True