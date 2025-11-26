// mobile/app/(tabs)/profile/admin/categories/edit/[id].tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Category, CategoryCreateData } from '../../../../../../services/productService';
import { Card } from '../../../../../../components/ui/Card';
import { Button } from '../../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../../context/ThemeContext';

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showParentModal, setShowParentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const fetchCategory = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const categoryData = await productService.getCategoryById(parseInt(id));
      setCategory(categoryData);

      // Populate form with existing data
      setFormData({
        name: categoryData.name,
        description: categoryData.description || '',
        parent: categoryData.parent || undefined,
      });

      // Set selected parent if exists
      if (categoryData.parent && categoryData.parent_name) {
        setSelectedParent({
          id: categoryData.parent,
          name: categoryData.parent_name,
          is_approved: true,
          created_at: '',
        });
      }
    } catch (err: any) {
      console.error('Error fetching category:', err);
      setError(err.message || 'Failed to load category');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      // Filter out the current category and its subcategories to prevent circular references
      const filteredCategories = data.filter(cat => 
        cat.id !== parseInt(id) && 
        (!category || !category.subcategories?.some(sub => sub.id === cat.id))
      );
      setCategories(filteredCategories);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategory();
    }, [id])
  );

  const onRefresh = () => {
    fetchCategory(true);
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

    setIsSubmitting(true);
    setError(null);

    try {
      await productService.updateCategory(parseInt(id), formData);
      Alert.alert(
        'Success',
        'Category updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category');
      Alert.alert('Error', err.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      onPress={() => handleParentSelect(item)}
      style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: selectedParent?.id === item.id ? `${theme.colors.primary}20` : 'transparent',
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

  if (isLoading) {
    return <LoadingSpinner message="Loading category..." fullScreen />;
  }

  if (error || !category) {
    return <ErrorMessage message={error || 'Category not found'} onRetry={() => fetchCategory()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
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
            Edit Category
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
              Leave empty to make this a top-level category
            </Text>
          </View>

          {/* Category Status */}
          <View style={{ 
            backgroundColor: theme.colors.background, 
            padding: 12, 
            borderRadius: 8,
            marginBottom: 16 
          }}>
            <Text style={{ color: theme.colors['text-primary'], fontWeight: '500', marginBottom: 8 }}>
              Current Status
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: category.is_approved ? '#10B98120' : '#FFA50020',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons
                  name={category.is_approved ? 'checkmark-done' : 'time'}
                  size={14}
                  color={category.is_approved ? '#10B981' : '#FF8C00'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: category.is_approved ? '#10B981' : '#FF8C00',
                  }}
                >
                  {category.is_approved ? 'Approved' : 'Pending'}
                </Text>
              </View>

              {category.subcategories && category.subcategories.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: `${theme.colors.primary}20`,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    gap: 4,
                  }}
                >
                  <Ionicons name="layers" size={14} color={theme.colors.primary} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: theme.colors.primary,
                    }}
                  >
                    {category.subcategories.length} subcategories
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Update Category"
            onPress={handleSubmit}
            loading={isSubmitting}
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