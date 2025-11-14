// mobile/app/(tabs)/receipts/add-item/[id].tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import receiptService from '../../../../services/receiptService';
import productService, { ProductSummary } from '../../../../services/productService';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';

export default function AddReceiptItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);

  // Product search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search for products
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await productService.searchProducts({ query });
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select product from search results
  const handleSelectProduct = (product: ProductSummary) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setSearchQuery(product.name);
    setShowSearchResults(false);
    
    // Pre-fill unit price if available
    if (product.lowest_price) {
      setUnitPrice(product.lowest_price.toString());
    }
  };

  // Clear product selection
  const handleClearProduct = () => {
    setSelectedProduct(null);
    setProductName('');
    setSearchQuery('');
    setUnitPrice('');
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!unitPrice || parseFloat(unitPrice) < 0) {
      newErrors.unitPrice = 'Valid unit price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate total price
  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return (qty * price).toFixed(2);
  };

  // Add item to receipt
  const handleAddItem = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const itemData = {
        product_name: productName,
        quantity: parseFloat(quantity),
        unit_price: parseFloat(unitPrice),
        total_price: parseFloat(calculateTotal()),
        category: category || undefined,
        product: selectedProduct?.id || undefined,
      };

      await receiptService.addReceiptItem(parseInt(id), itemData);

      Alert.alert('Success', 'Item added to receipt', [
        {
          text: 'Add Another',
          onPress: () => {
            // Reset form
            setProductName('');
            setQuantity('1');
            setUnitPrice('');
            setCategory('');
            setSelectedProduct(null);
            setSearchQuery('');
          },
        },
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
          {/* Product Search */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Search Product
            </Text>
            <Text className="text-gray-600 text-sm mb-3">
              Search for existing products or enter manually
            </Text>

            <View className="relative">
              <Input
                placeholder="Search for product..."
                value={searchQuery}
                onChangeText={handleSearch}
                icon="search-outline"
                containerClassName="mb-0"
              />
              {isSearching && (
                <View className="absolute right-3 top-3">
                  <LoadingSpinner size="small" />
                </View>
              )}
            </View>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <View className="mt-2 border border-gray-200 rounded-lg bg-white">
                {searchResults.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => handleSelectProduct(product)}
                    className="p-3 border-b border-gray-200"
                  >
                    <Text className="text-gray-800 font-medium">{product.name}</Text>
                    {product.brand && (
                      <Text className="text-sm text-gray-600">{product.brand}</Text>
                    )}
                    {product.lowest_price && (
                      <Text className="text-sm text-primary-600">
                        Lowest: ${product.lowest_price.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected Product */}
            {selectedProduct && (
              <View className="mt-3 bg-primary-50 border border-primary-200 rounded-lg p-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="checkmark-circle" size={20} color="#0284c7" />
                      <Text className="text-primary-700 font-semibold ml-2">
                        Product Selected
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-medium">{selectedProduct.name}</Text>
                    {selectedProduct.brand && (
                      <Text className="text-sm text-gray-600">{selectedProduct.brand}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleClearProduct} className="p-1">
                    <Ionicons name="close-circle" size={24} color="#0284c7" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>

          {/* Item Details */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Item Details
            </Text>

            <Input
              label="Product Name *"
              placeholder="Enter product name"
              value={productName}
              onChangeText={(value) => {
                setProductName(value);
                setErrors((prev) => ({ ...prev, productName: '' }));
              }}
              error={errors.productName}
              icon="pricetag-outline"
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  label="Quantity *"
                  placeholder="1"
                  value={quantity}
                  onChangeText={(value) => {
                    setQuantity(value);
                    setErrors((prev) => ({ ...prev, quantity: '' }));
                  }}
                  error={errors.quantity}
                  icon="calculator-outline"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Unit Price *"
                  placeholder="0.00"
                  value={unitPrice}
                  onChangeText={(value) => {
                    setUnitPrice(value);
                    setErrors((prev) => ({ ...prev, unitPrice: '' }));
                  }}
                  error={errors.unitPrice}
                  icon="cash-outline"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Input
              label="Category (Optional)"
              placeholder="e.g., Dairy, Produce"
              value={category}
              onChangeText={setCategory}
              icon="list-outline"
            />

            {/* Total Preview */}
            {quantity && unitPrice && (
              <View className="bg-gray-50 rounded-lg p-3 mt-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Total Price:</Text>
                  <Text className="text-xl font-bold text-primary-600">
                    ${calculateTotal()}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1 text-center">
                  {quantity} × ${unitPrice} = ${calculateTotal()}
                </Text>
              </View>
            )}
          </Card>

          {/* Info Note */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#0284c7" />
              <Text className="flex-1 text-blue-800 text-sm ml-2">
                Link this item to an existing product to enable price tracking and
                comparisons.
              </Text>
            </View>
          </View>

          {/* Add Button */}
          <Button
            title="Add Item"
            onPress={handleAddItem}
            loading={isSaving}
            fullWidth
            size="lg"
          />

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="py-3 items-center mt-3"
            disabled={isSaving}
          >
            <Text className="text-gray-600 font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}