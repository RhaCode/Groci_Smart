// mobile/app/(tabs)/profile/admin/prices/create.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { AddPriceData, Product, Store } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

export default function CreatePriceScreen() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<AddPriceData>({
    product: 0,
    store: 0,
    price: 0,
    date_recorded: new Date().toISOString().split('T')[0], // Today's date
    source: 'manual',
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    fetchProductsAndStores();
  }, []);

  const fetchProductsAndStores = async () => {
    try {
      const [productsData, storesData] = await Promise.all([
        productService.getProducts(),
        productService.getStores(),
      ]);
      setProducts(productsData.results as any); // Type assertion for simplicity
      setStores(storesData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load products and stores');
    }
  };

  const handleInputChange = (field: keyof AddPriceData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      product: product.id,
    }));
    setShowProductModal(false);
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setFormData(prev => ({
      ...prev,
      store: store.id,
    }));
    setShowStoreModal(false);
  };

  const validateForm = (): boolean => {
    if (!formData.product) {
      Alert.alert('Error', 'Please select a product');
      return false;
    }
    if (!formData.store) {
      Alert.alert('Error', 'Please select a store');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await productService.addPrice(formData);
      Alert.alert(
        'Success',
        'Price added successfully! It will be available after approval.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error adding price:', err);
      setError(err.message || 'Failed to add price');
      Alert.alert('Error', err.message || 'Failed to add price');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => handleProductSelect(item)}
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors['text-primary'], fontSize: 16, fontWeight: '500' }}>
        {item.name}
      </Text>
      <Text style={{ color: theme.colors['text-secondary'], fontSize: 12, marginTop: 4 }}>
        {item.brand} • {item.unit}
      </Text>
      {item.category_name && (
        <Text style={{ color: theme.colors['text-muted'], fontSize: 11, marginTop: 2 }}>
          {item.category_name}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderStoreItem = ({ item }: { item: Store }) => (
    <TouchableOpacity
      onPress={() => handleStoreSelect(item)}
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors['text-primary'], fontSize: 16, fontWeight: '500' }}>
        {item.name}
      </Text>
      <Text style={{ color: theme.colors['text-secondary'], fontSize: 12, marginTop: 4 }}>
        {item.location}
      </Text>
      {item.address && (
        <Text style={{ color: theme.colors['text-muted'], fontSize: 11, marginTop: 2 }}>
          {item.address}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => setError(null)}
          />
        )}

        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.colors['text-primary'],
              marginBottom: 16,
            }}
          >
            Add New Price
          </Text>

          {/* Product Selector */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Product *
            </Text>
            <TouchableOpacity
              onPress={() => setShowProductModal(true)}
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: selectedProduct ? theme.colors['text-primary'] : theme.colors['text-muted'],
                  fontSize: 16,
                }}
              >
                {selectedProduct ? selectedProduct.name : 'Select a product'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors['text-muted']} />
            </TouchableOpacity>
          </View>

          {/* Store Selector */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Store *
            </Text>
            <TouchableOpacity
              onPress={() => setShowStoreModal(true)}
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: selectedStore ? theme.colors['text-primary'] : theme.colors['text-muted'],
                  fontSize: 16,
                }}
              >
                {selectedStore ? `${selectedStore.name} (${selectedStore.location})` : 'Select a store'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors['text-muted']} />
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Price *
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ color: theme.colors['text-primary'], fontSize: 16, marginRight: 8 }}>
                $
              </Text>
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  color: theme.colors['text-primary'],
                  fontSize: 16,
                }}
                placeholder="0.00"
                placeholderTextColor={theme.colors['text-muted']}
                value={formData.price === 0 ? '' : formData.price.toString()}
                onChangeText={(value) => handleInputChange('price', parseFloat(value) || 0)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Date Recorded */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Date Recorded
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                color: theme.colors['text-primary'],
                fontSize: 16,
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.date_recorded}
              onChangeText={(value) => handleInputChange('date_recorded', value)}
            />
            <Text style={{ color: theme.colors['text-muted'], fontSize: 12, marginTop: 4 }}>
              Format: YYYY-MM-DD (leave empty for today)
            </Text>
          </View>

          {/* Source */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Source
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                color: theme.colors['text-primary'],
                fontSize: 16,
              }}
              placeholder="e.g., manual, scan, import"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.source}
              onChangeText={(value) => handleInputChange('source', value)}
            />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Add Price"
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
            size="lg"
          />
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors['text-primary'] }}>
              Select Product
            </Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors['text-primary']} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </Modal>

      {/* Store Selection Modal */}
      <Modal
        visible={showStoreModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStoreModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors['text-primary'] }}>
              Select Store
            </Text>
            <TouchableOpacity onPress={() => setShowStoreModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors['text-primary']} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={stores}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderStoreItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </Modal>
    </View>
  );
}