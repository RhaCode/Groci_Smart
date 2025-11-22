"""
Management command to load sample Jamaican products and prices
products/management/commands/load_jamaican_products.py

python manage.py load_jamaican_products
python manage.py load_jamaican_products --clear
python manage.py load_jamaican_products --fixture path/to/custom.json
"""

import json
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from products.models import Store, Category, Product, PriceHistory
from decimal import Decimal


class Command(BaseCommand):
    help = 'Load sample Jamaican products and prices in JMD'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing data before loading',
        )
        parser.add_argument(
            '--fixture',
            type=str,
            default='products/fixtures/jamaican_products.json',
            help='Path to the JSON fixture file',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(
                self.style.WARNING('Clearing all existing data...')
            )
            self._clear_data()
            self.stdout.write(
                self.style.SUCCESS('Data cleared successfully.')
            )

        fixture_path = options['fixture']
        try:
            with open(fixture_path, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            raise CommandError(f'Fixture file not found: {fixture_path}')
        except json.JSONDecodeError:
            raise CommandError(f'Invalid JSON in fixture file: {fixture_path}')

        self.stdout.write(self.style.SUCCESS('Loading Jamaican products and prices...'))
        
        # Load stores
        self.stdout.write('Creating stores...')
        stores = self._create_stores(data.get('stores', []))
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created {len(stores)} stores')
        )

        # Load categories
        self.stdout.write('Creating categories...')
        categories = self._create_categories(data.get('categories', []))
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created {len(categories)} categories')
        )

        # Load products
        self.stdout.write('Creating products...')
        products = self._create_products(data.get('products', []), categories)
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created {len(products)} products')
        )

        # Load prices
        self.stdout.write('Creating price history...')
        price_count = self._create_prices(data.get('prices', []), products, stores)
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created {price_count} price records')
        )

        self.stdout.write(
            self.style.SUCCESS('\n✓ Successfully loaded all Jamaican products and prices!')
        )

    def _clear_data(self):
        """Clear all existing data"""
        PriceHistory.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Store.objects.all().delete()

    def _create_stores(self, stores_data):
        """Create stores from fixture data"""
        stores = {}
        for store_data in stores_data:
            store, created = Store.objects.get_or_create(
                name=store_data['name'],
                defaults={
                    'location': store_data.get('location', ''),
                    'address': store_data.get('address', ''),
                    'latitude': store_data.get('latitude'),
                    'longitude': store_data.get('longitude'),
                }
            )
            stores[store_data['name']] = store
        return stores

    def _create_categories(self, categories_data):
        """Create categories from fixture data"""
        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data.get('description', ''),
                }
            )
            categories[cat_data['name']] = category
        return categories

    def _create_products(self, products_data, categories):
        """Create products from fixture data"""
        products = {}
        for prod_data in products_data:
            category = categories.get(prod_data.get('category'))
            product, created = Product.objects.get_or_create(
                normalized_name=prod_data['normalized_name'],
                defaults={
                    'name': prod_data['name'],
                    'category': category,
                    'brand': prod_data.get('brand', ''),
                    'unit': prod_data.get('unit', ''),
                    'barcode': prod_data.get('barcode'),
                    'description': prod_data.get('description', ''),
                }
            )
            products[prod_data['name']] = product
        return products

    def _create_prices(self, prices_data, products, stores):
        """Create price history from fixture data"""
        price_count = 0
        for price_data in prices_data:
            product = products.get(price_data['product_name'])
            store = stores.get(price_data['store_name'])
            
            if not product or not store:
                self.stdout.write(
                    self.style.WARNING(
                        f'⚠ Skipped price: Product or Store not found - '
                        f'{price_data.get("product_name")} @ {price_data.get("store_name")}'
                    )
                )
                continue

            price_history, created = PriceHistory.objects.get_or_create(
                product=product,
                store=store,
                date_recorded=price_data.get('date_recorded'),
                defaults={
                    'price': Decimal(str(price_data['price'])),
                    'source': price_data.get('source', 'manual'),
                    'is_active': True,
                }
            )
            if created:
                price_count += 1

        return price_count