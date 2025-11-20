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
            r'(?:^|\n)([A-Z][A-Za-z\s&]+(?:SUPERMARKET|STORE|MART|SHOP|MARKET|GROCERY))',
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
        
        # Item line pattern: product name, quantity, price
        self.item_patterns = [
            r'([A-Za-z][A-Za-z\s\-]{2,40})\s+(\d+[.,]?\d*)\s+\$?\s*(\d+[.,]\d{2})',  # Name Qty Price
            r'([A-Za-z][A-Za-z\s\-]{2,40})\s+\$?\s*(\d+[.,]\d{2})',  # Name Price (assume qty=1)
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
        print("Parsing items from lines:", lines)
        for line in lines:
            # Skip lines that are too short or contain keywords we want to ignore
            if len(line.strip()) < 5:
                continue
            
            ignore_keywords = ['TOTAL', 'SUBTOTAL', 'TAX', 'CHANGE', 'PAID', 'CARD', 'CASH']
            if any(keyword in line.upper() for keyword in ignore_keywords):
                continue
            
            # Try to match item patterns
            item = self.parse_item_line(line)
            if item:
                items.append(item)
        print("Extracted items:", items)
        return items
    
    def parse_item_line(self, line):
        """Parse a single line to extract item information"""
        # Try pattern with quantity
        match = re.search(
            r'([A-Za-z][A-Za-z\s\-]{2,40}?)\s+(\d+[.,]?\d*)\s+\$?\s*(\d+[.,]\d{2})',
            line
        )
        
        if match:
            name = match.group(1).strip()
            quantity = match.group(2).replace(',', '.')
            price = match.group(3).replace(',', '.')
            
            try:
                quantity = Decimal(quantity)
                total_price = Decimal(price)
                unit_price = total_price / quantity if quantity > 0 else total_price
                
                return {
                    'name': name,
                    'normalized_name': name.lower().strip(),
                    'quantity': quantity,
                    'unit_price': unit_price,
                    'total_price': total_price
                }
            except:
                pass
        
        # Try pattern without quantity (assume quantity = 1)
        match = re.search(
            r'([A-Za-z][A-Za-z\s\-]{2,40}?)\s+\$?\s*(\d+[.,]\d{2})',
            line
        )
        
        if match:
            name = match.group(1).strip()
            price = match.group(2).replace(',', '.')
            
            try:
                total_price = Decimal(price)
                
                return {
                    'name': name,
                    'normalized_name': name.lower().strip(),
                    'quantity': Decimal('1.0'),
                    'unit_price': total_price,
                    'total_price': total_price
                }
            except:
                pass
        
        return None
    
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
    