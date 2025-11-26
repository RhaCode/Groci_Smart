// mobile/app/(tabs)/profile/admin/products/edit/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Product, Category } from '../../../../../../services/productService';
import { Card } from '../../../../../../components/ui/Card';
import { Button } from '../../../../../../components/ui/Button';
import { Input } from '../../../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../../context/ThemeContext';

interface FormData {
  name: string;
  brand: string;
  unit: string;
  category?: number;
  barcode?: string;
  description?: string;
  normalized_name: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    brand: '',
    unit: '',
    normalized_name: '',
    description: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const fetchProduct = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [productData, categoriesData] = await Promise.all([
        productService.getProductById(parseInt(id)),
        productService.getCategories(),
      ]);

      setProduct(productData);
      setCategories(categoriesData.filter((cat) => cat.is_approved));

      // Set form data
      setFormData({
        name: productData.name,
        brand: productData.brand,
        unit: productData.unit,
        barcode: productData.barcode,
        description: productData.description,
        normalized_name: productData.normalized_name,
      });

      // Set selected category
      if (productData.category) {
        const cat = categoriesData.find((c) => c.id === productData.category);
        if (cat) setSelectedCategory(cat);
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProduct();
    }, [id])
  );

  const onRefresh = () => {
    fetchProduct(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProduct = async () => {
    if (!validateForm() || !product) return;

    try {
      setIsSaving(true);

      const updateData = {
        name: formData.name,
        brand: formData.brand,
        unit: formData.unit,
        category: selectedCategory?.id,
        barcode: formData.barcode || undefined,
        description: formData.description || undefined,
        normalized_name: formData.normalized_name,
      };

      await productService.updateProduct(product.id, updateData);

      Alert.alert('Success', 'Product updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading product..." fullScreen />;
  }

  if (error || !product) {
    return <ErrorMessage message={error || 'Product not found'} onRetry={() => fetchProduct()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Form Card */}
          <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: theme.colors['text-primary'],
                marginBottom: 16,
              }}
            >
              Edit Product
            </Text>

            {/* Product Name */}
            <Input
              label="Product Name *"
              placeholder="Enter product name"
              value={formData.name}
              onChangeText={(value) => {
                setFormData((prev) => ({ ...prev, name: value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              error={errors.name}
              icon="pricetag-outline"
            />

            {/* Brand */}
            <Input
              label="Brand *"
              placeholder="Enter brand name"
              value={formData.brand}
              onChangeText={(value) => {
                setFormData((prev) => ({ ...prev, brand: value }));
                if (errors.brand) setErrors((prev) => ({ ...prev, brand: '' }));
              }}
              error={errors.brand}
              icon="bookmark-outline"
            />

            {/* Unit */}
            <Input
              label="Unit *"
              placeholder="e.g., kg, lbs, liters, each"
              value={formData.unit}
              onChangeText={(value) => {
                setFormData((prev) => ({ ...prev, unit: value }));
                if (errors.unit) setErrors((prev) => ({ ...prev, unit: '' }));
              }}
              error={errors.unit}
              icon="cube-outline"
            />

            {/* Category Selector */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors['text-primary'],
                  marginBottom: 8,
                }}
              >
                Category (Optional)
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.background,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Ionicons
                  name="folder-outline"
                  size={20}
                  color={theme.colors['text-muted']}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    flex: 1,
                    color: selectedCategory
                      ? theme.colors['text-primary']
                      : theme.colors['text-muted'],
                    fontSize: 16,
                  }}
                >
                  {selectedCategory ? selectedCategory.name : 'Select a category'}
                </Text>
                <Ionicons
                  name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors['text-muted']}
                />
              </TouchableOpacity>

              {/* Category Dropdown */}
              {showCategoryPicker && (
                <View
                  style={{
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 8,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategory(null);
                      setShowCategoryPicker(false);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                  >
                    <Text style={{ color: theme.colors['text-secondary'] }}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => {
                        setSelectedCategory(category);
                        setShowCategoryPicker(false);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors['text-primary'],
                          fontWeight: selectedCategory?.id === category.id ? '600' : '400',
                        }}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Barcode */}
            <Input
              label="Barcode (Optional)"
              placeholder="Enter barcode"
              value={formData.barcode}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, barcode: value }))
              }
              icon="barcode-outline"
            />

            {/* Description */}
            <Input
              label="Description (Optional)"
              placeholder="Enter product description"
              value={formData.description}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, description: value }))
              }
              icon="document-text-outline"
              multiline
              numberOfLines={4}
            />
          </Card>

          {/* Buttons */}
          <Button
            title="Update Product"
            onPress={handleUpdateProduct}
            loading={isSaving}
            fullWidth
            size="lg"
          />

          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isSaving}
            style={{ paddingVertical: 12, alignItems: 'center', marginTop: 12 }}
          >
            <Text
              style={{
                color: theme.colors['text-secondary'],
                fontWeight: '500',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}