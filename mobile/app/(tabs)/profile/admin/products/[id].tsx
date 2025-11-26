// mobile/app/(tabs)/profile/admin/products/[id].tsx
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
import productService, { Product } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

export default function AdminProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchProduct = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await productService.getProductById(parseInt(id));
      setProduct(data);
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

  const handleApprove = async () => {
    if (!product) return;

    Alert.alert('Approve Product', 'Are you sure you want to approve this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            setIsActioning(true);
            await productService.approveProduct(product.id);
            Alert.alert('Success', 'Product approved successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to approve product');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!product) return;

    Alert.alert('Reject Product', 'Are you sure you want to reject this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        onPress: async () => {
          try {
            setIsActioning(true);
            await productService.rejectProduct(product.id);
            Alert.alert('Success', 'Product rejected successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject product');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading product..." fullScreen />;
  }

  if (error || !product) {
    return <ErrorMessage message={error || 'Product not found'} onRetry={() => fetchProduct()} />;
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
                {product.name}
              </Text>
              {product.brand && (
                <Text
                  style={{
                    fontSize: 16,
                    color: theme.colors['text-secondary'],
                    marginBottom: 8,
                  }}
                >
                  {product.brand}
                </Text>
              )}
            </View>
            {!product.is_approved && (
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: product.is_active ? '#10B98120' : '#EF444420',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                gap: 4,
              }}
            >
              <Ionicons
                name={product.is_active ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={product.is_active ? '#10B981' : '#EF4444'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: product.is_active ? '#10B981' : '#EF4444',
                }}
              >
                {product.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>

            {product.is_approved && (
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

        {/* Product Details */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors['text-primary'],
              marginBottom: 12,
            }}
          >
            Details
          </Text>

          <View style={{ gap: 12 }}>
            {product.category_name && (
              <DetailRow label="Category" value={product.category_name} />
            )}
            <DetailRow label="Unit" value={product.unit} />
            {product.barcode && <DetailRow label="Barcode" value={product.barcode} />}
            {product.description && (
              <DetailRow label="Description" value={product.description} />
            )}
            <DetailRow
              label="Created"
              value={new Date(product.created_at).toLocaleDateString()}
            />
            {product.created_by_username && (
              <DetailRow label="Created By" value={product.created_by_username} />
            )}
          </View>
        </Card>

        {/* Price History */}
        {product.current_prices && product.current_prices.length > 0 && (
          <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors['text-primary'],
                marginBottom: 12,
              }}
            >
              Current Prices ({product.current_prices.length})
            </Text>

            <View style={{ gap: 8 }}>
              {product.current_prices.slice(0, 5).map((price) => (
                <View
                  key={price.id}
                  style={{
                    backgroundColor: theme.colors.background,
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontWeight: '500', color: theme.colors['text-primary'] }}>
                      {price.store_name}
                    </Text>
                    <Text style={{ fontWeight: '700', color: theme.colors.primary }}>
                      ${price.price}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.colors['text-muted'] }}>
                    {new Date(price.date_recorded).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>

            {product.current_prices.length > 5 && (
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors['text-secondary'],
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                +{product.current_prices.length - 5} more prices
              </Text>
            )}
          </Card>
        )}

        {/* Lowest Price */}
        {product.lowest_price && (
          <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors['text-primary'],
                marginBottom: 12,
              }}
            >
              Best Price
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  backgroundColor: `${theme.colors.success}20`,
                  borderRadius: 8,
                  padding: 12,
                  width: 80,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: theme.colors.success,
                  }}
                >
                  ${product.lowest_price.price}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors['text-primary'],
                    marginBottom: 4,
                  }}
                >
                  {product.lowest_price.store}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                  Store ID: {product.lowest_price.store_id}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/profile/admin/products/edit/[id]',
                params: { id: product.id },
              })
            }
            disabled={isActioning}
          >
            <Button
              title="Edit Product"
              onPress={() => {}}
              variant="secondary"
              fullWidth
              size="lg"
            />
          </TouchableOpacity>

          {!product.is_approved && (
            <>
              <Button
                title="Approve Product"
                onPress={handleApprove}
                loading={isActioning}
                fullWidth
                size="lg"
              />
              <Button
                title="Reject Product"
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