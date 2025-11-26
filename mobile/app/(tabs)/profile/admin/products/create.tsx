// mobile/app/(tabs)/profile/admin/products/create.tsx
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Category } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Input } from '../../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { useTheme } from '../../../../../context/ThemeContext';

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

export default function CreateProductScreen() {
  const { theme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
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

  // Load categories on mount
  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await productService.getCategories();
      setCategories(cats.filter((cat) => cat.is_approved));
    } catch (err) {
      console.error('Error loading categories:', err);
    }
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

  const handleCreateProduct = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const productData = {
        name: formData.name,
        brand: formData.brand,
        unit: formData.unit,
        category: selectedCategory?.id,
        barcode: formData.barcode || undefined,
        description: formData.description || undefined,
        normalized_name: formData.normalized_name || formData.name.toLowerCase().replace(/\s+/g, '_'),
      };

      await productService.createProduct(productData);

      Alert.alert('Success', 'Product created successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create product');
    } finally {
      setIsSaving(false);
    }
  };

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
              Create New Product
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
                      <Text style={{ color: theme.colors['text-primary'] }}>
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
            title="Create Product"
            onPress={handleCreateProduct}
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