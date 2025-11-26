// mobile/app/(tabs)/profile/admin/categories/create.tsx
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
import productService, { Category, CategoryCreateData } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

export default function CreateCategoryScreen() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showParentModal, setShowParentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CategoryCreateData>({
    name: '',
    description: '',
    parent: undefined,
  });

  const [selectedParent, setSelectedParent] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const handleInputChange = (field: keyof CategoryCreateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleParentSelect = (category: Category) => {
    setSelectedParent(category);
    setFormData(prev => ({
      ...prev,
      parent: category.id,
    }));
    setShowParentModal(false);
  };

  const handleRemoveParent = () => {
    setSelectedParent(null);
    setFormData(prev => ({
      ...prev,
      parent: undefined,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await productService.createCategory(formData);
      Alert.alert(
        'Success',
        'Category created successfully! It will be available after approval.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error creating category:', err);
      setError(err.message || 'Failed to create category');
      Alert.alert('Error', err.message || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      onPress={() => handleParentSelect(item)}
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors['text-primary'], fontSize: 16 }}>
        {item.name}
      </Text>
      {item.description && (
        <Text style={{ color: theme.colors['text-secondary'], fontSize: 12, marginTop: 4 }}>
          {item.description}
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
            Create New Category
          </Text>

          {/* Category Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Category Name *
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
              placeholder="Enter category name"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Description (Optional)
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
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Enter category description"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Parent Category Selector */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Parent Category (Optional)
            </Text>
            
            {selectedParent ? (
              <View
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
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors['text-primary'], fontSize: 16 }}>
                    {selectedParent.name}
                  </Text>
                  {selectedParent.description && (
                    <Text style={{ color: theme.colors['text-secondary'], fontSize: 12, marginTop: 4 }}>
                      {selectedParent.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={handleRemoveParent}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowParentModal(true)}
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
                    color: theme.colors['text-muted'],
                    fontSize: 16,
                  }}
                >
                  Select a parent category
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors['text-muted']} />
              </TouchableOpacity>
            )}
            
            <Text style={{ color: theme.colors['text-muted'], fontSize: 12, marginTop: 4 }}>
              Leave empty to create a top-level category
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Create Category"
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

      {/* Parent Category Selection Modal */}
      <Modal
        visible={showParentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowParentModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {/* Modal Header */}
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
              Select Parent Category
            </Text>
            <TouchableOpacity onPress={() => setShowParentModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors['text-primary']} />
            </TouchableOpacity>
          </View>

          {/* Categories List */}
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCategoryItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.colors['text-secondary'] }}>
                  No categories available
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}