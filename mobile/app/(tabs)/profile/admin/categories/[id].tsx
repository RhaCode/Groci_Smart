// mobile/app/(tabs)/profile/admin/categories/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Category } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

export default function AdminCategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchCategory = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await productService.getCategoryById(parseInt(id));
      setCategory(data);
    } catch (err: any) {
      console.error('Error fetching category:', err);
      setError(err.message || 'Failed to load category');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  const handleApprove = async () => {
    if (!category) return;

    Alert.alert('Approve Category', 'Are you sure you want to approve this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            setIsActioning(true);
            await productService.approveCategory(category.id);
            Alert.alert('Success', 'Category approved successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to approve category');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!category) return;

    Alert.alert('Reject Category', 'Are you sure you want to reject this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        onPress: async () => {
          try {
            setIsActioning(true);
            await productService.rejectCategory(category.id);
            Alert.alert('Success', 'Category rejected successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject category');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading category..." fullScreen />;
  }

  if (error || !category) {
    return <ErrorMessage message={error || 'Category not found'} onRetry={() => fetchCategory()} />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={{ padding: 16, paddingBottom: 40 }}>
        {/* Header Card */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: theme.colors['text-primary'],
                  marginBottom: 4,
                }}
              >
                {category.name}
              </Text>
              {category.description && (
                <Text
                  style={{
                    fontSize: 16,
                    color: theme.colors['text-secondary'],
                    marginBottom: 8,
                  }}
                >
                  {category.description}
                </Text>
              )}
            </View>
            {!category.is_approved && (
              <View
                style={{
                  backgroundColor: '#FFA50080',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#FF8C00' }}>
                  Pending
                </Text>
              </View>
            )}
          </View>

          {/* Status Badges */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {category.is_approved && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#10B98120',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons name="checkmark-done" size={14} color="#10B981" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>
                  Approved
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Category Details */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors['text-primary'],
              marginBottom: 12,
            }}
          >
            Category Information
          </Text>

          <View style={{ gap: 12 }}>
            {category.parent_name && (
              <DetailRow label="Parent Category" value={category.parent_name} />
            )}
            <DetailRow
              label="Created"
              value={new Date(category.created_at).toLocaleDateString()}
            />
            {category.created_by_username && (
              <DetailRow label="Created By" value={category.created_by_username} />
            )}
          </View>
        </Card>

        {/* Subcategories */}
        {category.subcategories && category.subcategories.length > 0 && (
          <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors['text-primary'],
                marginBottom: 12,
              }}
            >
              Subcategories ({category.subcategories.length})
            </Text>

            <View style={{ gap: 8 }}>
              {category.subcategories.slice(0, 5).map((subcategory) => (
                <View
                  key={subcategory.id}
                  style={{
                    backgroundColor: theme.colors.background,
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '500', color: theme.colors['text-primary'] }}>
                    {subcategory.name}
                  </Text>
                  {!subcategory.is_approved && (
                    <View
                      style={{
                        backgroundColor: '#FFA50040',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: '#FF8C00', fontWeight: '600' }}>
                        Pending
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {category.subcategories.length > 5 && (
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors['text-secondary'],
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                +{category.subcategories.length - 5} more subcategories
              </Text>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/profile/admin/categories/edit/[id]',
                params: { id: category.id },
              })
            }
            disabled={isActioning}
          >
            <Button
              title="Edit Category"
              onPress={() => {}}
              variant="secondary"
              fullWidth
              size="lg"
            />
          </TouchableOpacity>

          {!category.is_approved && (
            <>
              <Button
                title="Approve Category"
                onPress={handleApprove}
                loading={isActioning}
                fullWidth
                size="lg"
              />
              <Button
                title="Reject Category"
                onPress={handleReject}
                loading={isActioning}
                variant="danger"
                fullWidth
                size="lg"
              />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// Detail Row Component
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors['text-secondary'], flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors['text-primary'],
          fontWeight: '500',
          flex: 1,
          textAlign: 'right',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
};