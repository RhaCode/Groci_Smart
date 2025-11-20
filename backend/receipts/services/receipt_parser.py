"""
Receipt parsing service
backend/receipts/services/receipt_parser.py
"""

import re
from datetime import datetime
from decimal import Decimal


class ReceiptParser:
    """Service for parsing OCR text from receipts"""
    
    def __init__(self):
        # Common store name patterns
        self.store_patterns = [
            r'(?:^|\n)([A-Z][A-Za-z\s&]+(?:SUPERMARKET|STORE|MART|SHOP|MARKET|GROCERY|DEPOT))',
            r'(?:^|\n)([A-Z][A-Z\s&]{3,30})',  # All caps store names
        ]
        
        # Date patterns
        self.date_patterns = [
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',  # DD-MM-YYYY or MM-DD-YYYY
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',    # YYYY-MM-DD
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})',  # DD Mon YYYY
        ]
        
        # Amount patterns
        self.total_patterns = [
            r'TOTAL[:\s]*\$?\s*(\d+[.,]\d{2})',
            r'AMOUNT[:\s]*\$?\s*(\d+[.,]\d{2})',
            r'BALANCE[:\s]*\$?\s*(\d+[.,]\d{2})',
        ]
        
        self.tax_patterns = [
            r'TAX[:\s]*\$?\s*(\d+[.,]\d{2})',
            r'GST[:\s]*\$?\s*(\d+[.,]\d{2})',
            r'VAT[:\s]*\$?\s*(\d+[.,]\d{2})',
        ]
    
    def parse_receipt_text(self, text):
        """
        Parse receipt text and extract structured data
        
        Args:
            text: OCR extracted text from receipt
            
        Returns:
            dict: Parsed receipt data with store, date, items, totals
        """
        if not text:
            return {}
        
        parsed_data = {
            'store_name': self.extract_store_name(text),
            'purchase_date': self.extract_date(text),
            'total_amount': self.extract_total(text),
            'tax_amount': self.extract_tax(text),
            'items': self.extract_items(text)
        }
        
        return parsed_data
    
    def extract_store_name(self, text):
        """Extract store name from receipt text"""
        # Try to find store name in first few lines
        lines = text.split('\n')[:5]  # Check first 5 lines
        
        for pattern in self.store_patterns:
            for line in lines:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    store_name = match.group(1).strip()
                    # Clean up the store name
                    store_name = re.sub(r'\s+', ' ', store_name)
                    return store_name
        
        return ''
    
    def extract_date(self, text):
        """Extract purchase date from receipt text"""
        for pattern in self.date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                return self.parse_date_string(date_str)
        
        return None
    
    def parse_date_string(self, date_str):
        """Parse date string into datetime.date object"""
        # Try common date formats
        date_formats = [
            '%d-%m-%Y', '%d/%m/%Y',
            '%m-%d-%Y', '%m/%d/%Y',
            '%Y-%m-%d', '%Y/%m/%d',
            '%d-%m-%y', '%d/%m/%y',
            '%m-%d-%y', '%m/%d/%y',
            '%d %b %Y', '%d %B %Y',
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        return None
    
    def extract_total(self, text):
        """Extract total amount from receipt text"""
        for pattern in self.total_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    return Decimal(amount_str)
                except:
                    continue
        
        return Decimal('0.00')
    
    def extract_tax(self, text):
        """Extract tax amount from receipt text"""
        for pattern in self.tax_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    return Decimal(amount_str)
                except:
                    continue
        
        return None
    
    def extract_items(self, text):
        """Extract line items from receipt text"""
        items = []
        lines = text.split('\n')
        
        print("DEBUG: Parsing items from lines:", lines)
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip empty lines
            if len(line) < 2:
                i += 1
                continue
            
            # Skip lines with keywords to ignore
            ignore_keywords = ['SUBTOTAL', 'TAX', 'TOTAL', 'CHANGE', 'TEND', 'PAID', 'CARD', 'CASH', 
                             'Item Count', 'Thanks', 'Date', 'Time', 'Lane', 'Clerk', 'Trans', 
                             'Cashier', 'GA-', 'Douglasville']
            if any(keyword.upper() in line.upper() for keyword in ignore_keywords):
                i += 1
                continue
            
            # Try to parse item (handles multi-line formats)
            item = self.parse_item_multiline(lines, i)
            if item:
                items.append(item)
                # Skip the lines that were consumed
                i += item.get('lines_consumed', 1)
                continue
            
            i += 1
        
        # Clean up items - remove the 'lines_consumed' key
        for item in items:
            item.pop('lines_consumed', None)
        
        print("DEBUG: Extracted items:", items)
        return items
    
    def parse_item_multiline(self, lines, current_index):
        """
        Parse items that span multiple lines
        
        Format patterns:
        1. PRODUCT NAME
           $PRICE TFA
           QTY EA
           @ UNIT_PRICE/EA
           
        2. PRODUCT NAME
           $PRICE TFA
           
        3. PRODUCT NAME    $PRICE
        """
        
        line = lines[current_index].strip()
        
        # Check if this line looks like a product name (all caps letters, spaces, numbers)
        # Must NOT start with $ or @ or be a number-only line
        if not re.match(r'^[A-Z][A-Z\s0-9\-&]+$', line):
            return None
        
        # Skip if line is too short or contains ignore patterns
        if len(line) < 3 or re.search(r'^\d+$', line) or '@' in line or '$' in line:
            return None
        
        product_name = line
        
        # Look for price on next line
        if current_index + 1 >= len(lines):
            return None
            
        next_line = lines[current_index + 1].strip()
        
        # Check if next line has a price
        price_match = re.search(r'^\$(\d+\.\d{2})\s*(?:TFA|T)?$', next_line)
        if not price_match:
            return None
        
        total_price = Decimal(price_match.group(1))
        quantity = Decimal('1.0')
        unit_price = total_price
        lines_consumed = 2
        
        # Check if there's quantity info on the next lines
        if current_index + 2 < len(lines):
            qty_line = lines[current_index + 2].strip()
            
            # Check for quantity pattern: "4EA" or "4 EA"
            qty_match = re.search(r'^(\d+)\s*EA$', qty_line)
            if qty_match:
                quantity = Decimal(qty_match.group(1))
                lines_consumed = 3
                
                # Check for unit price on next line
                if current_index + 3 < len(lines):
                    unit_line = lines[current_index + 3].strip()
                    unit_match = re.search(r'^@?\s*(\d+\.\d{2})/EA$', unit_line)
                    if unit_match:
                        unit_price = Decimal(unit_match.group(1))
                        lines_consumed = 4
        
        return {
            'name': product_name,
            'normalized_name': product_name.lower().strip(),
            'quantity': quantity,
            'unit_price': unit_price,
            'total_price': total_price,
            'lines_consumed': lines_consumed
        }
    
    def normalize_product_name(self, name):
        """Normalize product name for matching"""
        # Convert to lowercase
        normalized = name.lower()
        
        # Remove special characters
        normalized = re.sub(r'[^\w\s]', '', normalized)
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        # Remove common words that don't help with matching
        common_words = ['the', 'a', 'an', 'and', 'or', 'of']
        words = normalized.split()
        normalized = ' '.join([w for w in words if w not in common_words])
        
        return normalized
    