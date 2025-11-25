"""
Universal Receipt parser - optimized for all receipt formats
backend/receipts/services/receipt_parser.py
"""

import re
from datetime import datetime
from decimal import Decimal


class ReceiptParser:
    """Service for parsing OCR text from receipts with support for multiple formats"""
    
    def __init__(self):
        self.store_patterns = [
            r'(?:^|\n)([A-Z][A-Za-z\s&]+(?:SUPERMARKET|STORE|MART|SHOP|MARKET|GROCERY|DEPOT))',
            r'(?:^|\n)([A-Z][A-Z\s&]{3,30})',
        ]
        
        self.date_patterns = [
            r'(?:DATE|TIME|Date|Time)[:\s]+([A-Za-z]+\s+\d{1,2}\s+\d{4})',
            r'(?:DATE|TIME|Date|Time)[:\s]+(\d{1,2}/\d{1,2}/\d{4})\s+\d{1,2}:\d{2}',
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',
        ]
        
        self.total_patterns = [
            r'(?:^|\n)\s*(?:TOTAL\s+SALES|GRAND\s+TOTAL|TOTAL)[:\s]*\$?\s*([0-9¥.,]+)',
        ]
        
        self.tax_patterns = [
            r'(?:^|\n)\s*(?:GCT|TAX|VAT|GST|Tax\s+\d)[:\s]*\$?\s*([0-9.,]+)',
        ]
        
        self.category_keywords = {
            'Produce': ['vegetable', 'fruit', 'lettuce', 'tomato', 'potato', 'onion', 'carrot', 'apple', 'banana', 'orange', 'garlic'],
            'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'],
            'Meat': ['chicken', 'beef', 'pork', 'meat', 'sausage', 'bacon', 'corned'],
            'Bakery': ['bread', 'cake', 'pastry', 'bun', 'roll', 'bulla'],
            'Beverages': ['juice', 'soda', 'water', 'drink', 'cola', 'tea', 'coffee'],
            'Household': ['soap', 'detergent', 'cleaner', 'tissue', 'paper', 'bag'],
            'Snacks': ['chip', 'cashew', 'puff', 'cracker', 'nibble'],
            'Condiments': ['sauce', 'seasoning', 'margarine', 'salt', 'sugar', 'flour', 'cornmeal'],
            'Tobacoo': ['cigarette', 'craven'],
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
    
    def _is_price_or_qty_line(self, line):
        """Check if a line is primarily prices or quantity info"""
        # Lines with @ symbol are price indicators
        if ' @ ' in line or ' @ $' in line or '@ $' in line:
            return True
        
        # Lines that start with pure numbers (qty indicators)
        if re.match(r'^\s*\d+(?:[.,]\d+)?\s*(?:@|\$|¥)', line):
            return True
        
        # Lines with multiple prices
        prices = re.findall(r'\d+[,.]?\d*[.,]\d{2}', line)
        if len(prices) >= 2 and len(line) < 50:
            return True
        
        return False
    
    def extract_store_name(self, text):
        """Extract store name from receipt text"""
        lines = text.split('\n')[:10]
        
        # First try standard patterns (SUPERMARKET, STORE, etc.)
        for pattern in self.store_patterns:
            for line in lines:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    store_name = match.group(1).strip()
                    store_name = re.sub(r'\s+', ' ', store_name)
                    if len(store_name) > 3:  # Ensure it's a reasonable name
                        return store_name
        
        # Fallback: look for lines with "Supermarket" anywhere (catches "M . D Lin's Supermarket")
        for line in lines:
            if 'supermarket' in line.lower() or 'market' in line.lower() or 'store' in line.lower():
                # Extract the meaningful part before or including these keywords
                match = re.search(r'^(.+?(?:supermarket|market|store))', line, re.IGNORECASE)
                if match:
                    store_name = match.group(1).strip()
                    store_name = re.sub(r'\s+', ' ', store_name)
                    if len(store_name) > 3:
                        return store_name
        
        # Last resort: check if first non-empty line looks like a store name
        for line in lines:
            line = line.strip()
            if line and len(line) > 3 and not re.match(r'^[\d\-\(\)]+', line):
                # Skip lines that are just numbers/phone numbers
                if re.search(r'[A-Za-z]', line):
                    return line
        
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
        amount_str = amount_str.replace(' ', '').replace('¥', '').replace('$', '').strip()
        
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
        return self._extract_items_optimized(lines, start_idx, end_idx)
    
    def _find_item_section(self, lines):
        """Find start and end indices of the items section"""
        start_idx = 0
        end_idx = len(lines)
        
        for i, line in enumerate(lines):
            if any(kw in line.upper() for kw in ['DESCRIPTION', 'QTY', 'ITEM', '=====']):
                start_idx = i + 1
                break
        
        for i in range(start_idx, len(lines)):
            line_upper = lines[i].upper().strip()
            if any(kw in line_upper for kw in ['SUBTOTAL', 'GCT', 'TOTAL', 'DEBIT', 'CASH', 'PAYMENT', 'YOU SAVED', 'NET SALES', 'GRAND']):
                end_idx = i
                break
        
        return (start_idx, end_idx) if start_idx < end_idx else None
    
    def _extract_items_optimized(self, lines, start_idx, end_idx):
        """Extract items with optimized multi-format support"""
        items = []
        i = start_idx
        
        while i < end_idx:
            line = lines[i].strip()
            
            # Skip empty or separator lines
            if len(line) < 2 or re.match(r'^[=\-\s]+$', line):
                i += 1
                continue
            
            # Skip price/qty only lines
            if self._is_price_or_qty_line(line):
                i += 1
                continue
            
            if self._is_valid_product_name(line):
                item = self._parse_product_item(lines, i, end_idx)
                if item:
                    items.append(item)
                    i += item.pop('lines_consumed', 1)
                else:
                    i += 1
            else:
                i += 1
        
        return items
    
    def _parse_product_item(self, lines, current_idx, end_idx):
        """Parse a single product item across multiple lines"""
        line = lines[current_idx].strip()
        
        if not self._is_valid_product_name(line):
            return None
        
        product_name = line
        quantity = Decimal('1.0')
        unit_price = Decimal('0.00')
        total_price = Decimal('0.00')
        lines_consumed = 1
        
        # Collect prices from this line and following lines
        collected_prices = self._extract_prices_from_line(line)
        
        # Look ahead for more data (max 4 lines)
        lookahead_lines = []
        for offset in range(1, min(5, end_idx - current_idx)):
            next_line = lines[current_idx + offset].strip()
            
            if not next_line:
                break
            
            # Stop if we hit another product
            if self._is_valid_product_name(next_line) and offset > 1 and not self._is_price_or_qty_line(next_line):
                break
            
            lookahead_lines.append((offset, next_line))
            
            # Extract prices from this line
            more_prices = self._extract_prices_from_line(next_line)
            collected_prices.extend(more_prices)
            
            # Extract qty if present
            qty_match = re.search(r'^(\d+(?:[.,]\d+)?)\s+[@$¥]', next_line)
            if qty_match:
                try:
                    quantity = Decimal(self._normalize_amount_string(qty_match.group(1)))
                except:
                    pass
        
        # Parse collected prices intelligently
        self._assign_prices(collected_prices, quantity, product_name, 
                          lines[current_idx:current_idx + len(lookahead_lines) + 1])
        
        # Determine how many lines we consumed
        if collected_prices or (quantity > 1 and quantity != Decimal('1.0')):
            lines_consumed = len(lookahead_lines) + 1
        
        # Extract prices and quantities from collected data
        prices = sorted(set(collected_prices))  # Unique prices, sorted
        
        if len(prices) >= 2:
            # Multiple prices: likely [qty?, unit_price, total] or [unit_price, total]
            if prices[0] < 100 and quantity == Decimal('1.0'):
                # First is likely qty
                quantity = prices[0]
                unit_price = prices[1]
                total_price = prices[2] if len(prices) > 2 else prices[1]
            else:
                # Standard: unit_price, total_price
                unit_price = prices[-2] if len(prices) > 1 else prices[0]
                total_price = prices[-1]
        elif len(prices) == 1:
            unit_price = prices[0]
            if quantity > 1:
                total_price = unit_price * quantity
            else:
                total_price = unit_price
        
        # Validate item
        if not self._is_valid_item(product_name, quantity, unit_price, total_price):
            return None
        
        # Calculate missing values
        if unit_price == 0 and total_price > 0:
            unit_price = total_price / quantity if quantity > 0 else total_price
        if total_price == 0 and unit_price > 0:
            total_price = unit_price * quantity
        
        # Extract brand
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
    
    def _assign_prices(self, prices, quantity, product_name, text_lines):
        """Helper to assign prices intelligently (modifies prices list in place for sorting)"""
        pass  # Logic handled in _parse_product_item
    
    def _extract_prices_from_line(self, line):
        """Extract all decimal prices from a line"""
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