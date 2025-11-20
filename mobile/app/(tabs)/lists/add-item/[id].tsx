// mobile/app/(tabs)/lists/add-item/[id].tsx
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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import shoppingListService from '../../../../services/shoppingListService';
import productService, { ProductSummary } from '../../../../services/productService';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';

export default function AddListItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [notes, setNotes] = useState('');
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

  // Select product from search
  const handleSelectProduct = (product: ProductSummary) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setSearchQuery(product.name);
    setShowSearchResults(false);
    setUnit(product.unit);
    
    // Pre-fill price if available
    if (product.lowest_price) {
      setEstimatedPrice(product.lowest_price.toString());
    }
  };

  // Clear selection
  const handleClearProduct = () => {
    setSelectedProduct(null);
    setProductName('');
    setSearchQuery('');
    setUnit('');
    setEstimatedPrice('');
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add item
  const handleAddItem = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const itemData = {
        product_name: productName,
        quantity: parseFloat(quantity),
        unit: unit || undefined,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
        notes: notes || undefined,
        product: selectedProduct?.id || undefined,
      };

      await shoppingListService.addListItem(parseInt(id), itemData);

      Alert.alert('Success', 'Item added to list', [
        {
          text: 'Add Another',
          onPress: () => {
            setProductName('');
            setQuantity('1');
            setUnit('');
            setEstimatedPrice('');
            setNotes('');
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

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(estimatedPrice) || 0;
    return (qty * price).toFixed(2);
  };

  return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
          {/* Product Search */}
          <Card className="mb-4 bg-surface">
            <Text className="text-lg font-semibold text-text-primary mb-3">
              Search Product
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
              <View className="mt-2 border border-border rounded-lg bg-surface">
                {searchResults.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => handleSelectProduct(product)}
                    className="p-3 border-b border-border"
                  >
                    <Text className="text-text-primary font-medium">{product.name}</Text>
                    {product.brand && (
                      <Text className="text-sm text-text-secondary">{product.brand}</Text>
                    )}
                    {product.lowest_price && (
                      <Text className="text-sm text-success">
                        Best price: ${product.lowest_price.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected Product */}
            {selectedProduct && (
              <View className="mt-3 bg-accent/20 border border-accent/30 rounded-lg p-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="checkmark-circle" size={20} color="#d946ef" />
                      <Text className="text-accent font-semibold ml-2">
                        Product Selected
                      </Text>
                    </View>
                    <Text className="text-text-primary font-medium">{selectedProduct.name}</Text>
                    {selectedProduct.brand && (
                      <Text className="text-sm text-text-secondary">{selectedProduct.brand}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleClearProduct} className="p-1">
                    <Ionicons name="close-circle" size={24} color="#d946ef" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>

          {/* Item Details */}
          <Card className="mb-4 bg-surface">
            <Text className="text-lg font-semibold text-text-primary mb-3">
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
                  label="Unit"
                  placeholder="kg, lbs, each"
                  value={unit}
                  onChangeText={setUnit}
                  icon="cube-outline"
                />
              </View>
            </View>

            <Input
              label="Estimated Price (Optional)"
              placeholder="0.00"
              value={estimatedPrice}
              onChangeText={setEstimatedPrice}
              icon="cash-outline"
              keyboardType="decimal-pad"
            />

            <Input
              label="Notes (Optional)"
              placeholder="Any special notes..."
              value={notes}
              onChangeText={setNotes}
              icon="document-text-outline"
              multiline
              numberOfLines={3}
            />

            {/* Total Preview */}
            {quantity && estimatedPrice && (
              <View className="bg-accent/20 rounded-lg p-3 mt-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-text-secondary">Estimated Total:</Text>
                  <Text className="text-xl font-bold text-accent">
                    ${calculateTotal()}
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* Add Button */}
          <Button
            title="Add to List"
            onPress={handleAddItem}
            loading={isSaving}
            fullWidth
            size="lg"
            variant="secondary"
          />

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="py-3 items-center mt-3"
            disabled={isSaving}
          >
            <Text className="text-text-secondary font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}