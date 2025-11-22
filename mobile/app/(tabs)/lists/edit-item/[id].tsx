// mobile/app/(tabs)/lists/edit-item/[id].tsx
import React, { useState, useEffect } from 'react';
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
import shoppingListService, { ShoppingListItem } from '../../../../services/shoppingListService';
import productService, { ProductSummary } from '../../../../services/productService';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../context/ThemeContext';

export default function EditListItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // Form state
  const [item, setItem] = useState<ShoppingListItem | null>(null);
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

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Parse listId and itemId from the route parameter
      // Assuming format "listId-itemId" or just "itemId" if list context is available
      const [listId, itemId] = id.split('-').map(Number);
      
      if (!listId || !itemId) {
        throw new Error('Invalid item ID format');
      }

      const itemData = await shoppingListService.getListItem(listId, itemId);
      setItem(itemData);
      setProductName(itemData.product_name);
      setQuantity(itemData.quantity);
      setUnit(itemData.unit || '');
      setEstimatedPrice(itemData.estimated_price || '');
      setNotes(itemData.notes || '');
      
      // Set selected product if product details are available
    //   if (itemData.product_details) {
    //     setSelectedProduct({
    //       id: itemData.product_details.id,
    //       name: itemData.product_details.name,
    //       brand: itemData.product_details.brand || '',
    //       lowest_price: itemData.product_details.lowest_price,
    //       unit: itemData.unit // Use the item's unit as fallback
    //     });
    //   }
    } catch (err: any) {
      console.error('Error fetching item:', err);
      setError(err.message || 'Failed to load item');
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // Use product unit if available, otherwise keep existing unit
    if (product.unit) {
      setUnit(product.unit);
    }
    
    // Pre-fill price if available
    if (product.lowest_price) {
      setEstimatedPrice(product.lowest_price.toString());
    }
  };

  // Clear product selection
  const handleClearProduct = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    // Keep the current product name but clear other product-specific data
    if (item) {
      setUnit(item.unit || '');
      setEstimatedPrice(item.estimated_price || '');
    }
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

    if (estimatedPrice && parseFloat(estimatedPrice) < 0) {
      newErrors.estimatedPrice = 'Price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update item
  const handleUpdateItem = async () => {
    if (!validateForm() || !item) return;

    try {
      setIsSaving(true);

      const itemData = {
        product_name: productName.trim(),
        quantity: parseFloat(quantity),
        unit: unit.trim() || undefined,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
        notes: notes.trim() || undefined,
        product: selectedProduct?.id || undefined,
      };

      await shoppingListService.updateListItem(item.shopping_list, item.id, itemData);

      Alert.alert('Success', 'Item updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete item
  const handleDeleteItem = async () => {
    if (!item) return;

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.product_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await shoppingListService.deleteListItem(item.shopping_list, item.id);
              Alert.alert('Success', 'Item deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete item');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(estimatedPrice) || 0;
    return (qty * price).toFixed(2);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading item..." fullScreen />;
  }

  if (error || !item) {
    return (
      <ErrorMessage 
        message={error || 'Item not found'} 
        onRetry={fetchItem}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
          {/* Current Item Info */}
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 8 
            }}>
              Editing Item
            </Text>
            <View style={{ 
              backgroundColor: `${theme.colors.accent}10`, 
              borderRadius: 8, 
              padding: 12,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.accent
            }}>
              <Text style={{ 
                color: theme.colors['text-primary'], 
                fontWeight: '500',
                marginBottom: 4
              }}>
                {item.product_name}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors['text-secondary'] 
              }}>
                Quantity: {parseFloat(item.quantity).toString()}
                {item.unit && ` ${item.unit}`}
                {item.estimated_price && ` • $${parseFloat(item.estimated_price).toFixed(2)} each`}
              </Text>
            </View>
          </Card>

          {/* Product Search */}
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 12 
            }}>
              Search Product
            </Text>

            <View style={{ position: 'relative' }}>
              <Input
                placeholder="Search for product..."
                value={searchQuery}
                onChangeText={handleSearch}
                icon="search-outline"
                containerStyle={{ marginBottom: 0 }}
              />
              {isSearching && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <LoadingSpinner size="small" />
                </View>
              )}
            </View>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <View style={{ 
                marginTop: 8, 
                borderWidth: 1, 
                borderColor: theme.colors.border, 
                borderRadius: 8, 
                backgroundColor: theme.colors.surface,
                maxHeight: 200
              }}>
                <ScrollView>
                  {searchResults.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() => handleSelectProduct(product)}
                      style={{ 
                        padding: 12, 
                        borderBottomWidth: 1, 
                        borderBottomColor: theme.colors.border 
                      }}
                    >
                      <Text style={{ 
                        color: theme.colors['text-primary'], 
                        fontWeight: '500' 
                      }}>
                        {product.name}
                      </Text>
                      {product.brand && (
                        <Text style={{ 
                          fontSize: 14, 
                          color: theme.colors['text-secondary'] 
                        }}>
                          {product.brand}
                        </Text>
                      )}
                      {product.lowest_price && (
                        <Text style={{ 
                          fontSize: 14, 
                          color: theme.colors.success 
                        }}>
                          Best price: ${product.lowest_price.toFixed(2)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Selected Product */}
            {selectedProduct && (
              <View style={{ 
                marginTop: 12, 
                backgroundColor: `${theme.colors.accent}20`, 
                borderWidth: 1, 
                borderColor: `${theme.colors.accent}30`, 
                borderRadius: 8, 
                padding: 12 
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} />
                      <Text style={{ 
                        color: theme.colors.accent, 
                        fontWeight: '600', 
                        marginLeft: 8 
                      }}>
                        Product Selected
                      </Text>
                    </View>
                    <Text style={{ 
                      color: theme.colors['text-primary'], 
                      fontWeight: '500' 
                    }}>
                      {selectedProduct.name}
                    </Text>
                    {selectedProduct.brand && (
                      <Text style={{ 
                        fontSize: 14, 
                        color: theme.colors['text-secondary'] 
                      }}>
                        {selectedProduct.brand}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleClearProduct} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={24} color={theme.colors.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>

          {/* Item Details */}
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 12 
            }}>
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

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
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
              <View style={{ flex: 1 }}>
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
              onChangeText={(value) => {
                setEstimatedPrice(value);
                setErrors((prev) => ({ ...prev, estimatedPrice: '' }));
              }}
              error={errors.estimatedPrice}
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
            {quantity && estimatedPrice && parseFloat(estimatedPrice) > 0 && (
              <View style={{ 
                backgroundColor: `${theme.colors.accent}20`, 
                borderRadius: 8, 
                padding: 12, 
                marginTop: 8 
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: theme.colors['text-secondary'] }}>Estimated Total:</Text>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: theme.colors.accent 
                  }}>
                    ${calculateTotal()}
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* Action Buttons */}
          <View style={{ gap: 12, marginBottom: 16 }}>
            <Button
              title="Update Item"
              onPress={handleUpdateItem}
              loading={isSaving}
              fullWidth
              size="lg"
              variant="primary"
            />

            <Button
              title="Delete Item"
              onPress={handleDeleteItem}
              loading={isDeleting}
              fullWidth
              variant="danger"
            />

            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingVertical: 12, alignItems: 'center' }}
              disabled={isSaving || isDeleting}
            >
              <Text style={{ 
                color: theme.colors['text-secondary'], 
                fontWeight: '500' 
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}