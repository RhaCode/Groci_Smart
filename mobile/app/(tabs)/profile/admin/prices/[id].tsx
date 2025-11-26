// mobile/app/(tabs)/profile/admin/prices/[id].tsx
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
import productService, { PriceHistory } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

export default function AdminPriceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [price, setPrice] = useState<PriceHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchPrice = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Use the new getPriceById endpoint
      const priceData = await productService.getPriceById(parseInt(id));
      setPrice(priceData);
    } catch (err: any) {
      console.error('Error fetching price:', err);
      setError(err.message || 'Failed to load price');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPrice();
    }, [id])
  );

  const onRefresh = () => {
    fetchPrice(true);
  };

  const handleApprove = async () => {
    if (!price) return;

    Alert.alert('Approve Price', 'Are you sure you want to approve this price?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            setIsActioning(true);
            await productService.approvePrice(price.id);
            Alert.alert('Success', 'Price approved successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to approve price');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!price) return;

    Alert.alert('Reject Price', 'Are you sure you want to reject this price?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        onPress: async () => {
          try {
            setIsActioning(true);
            await productService.rejectPrice(price.id);
            Alert.alert('Success', 'Price rejected successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject price');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading price..." fullScreen />;
  }

  if (error || !price) {
    return <ErrorMessage message={error || 'Price not found'} onRetry={() => fetchPrice()} />;
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
                  fontSize: 24,
                  fontWeight: '700',
                  color: theme.colors.primary,
                  marginBottom: 4,
                }}
              >
                ${price.price}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: theme.colors['text-secondary'],
                  marginBottom: 8,
                }}
              >
                {price.store_name} • {price.store_location}
              </Text>
            </View>
            {!price.is_approved && (
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
                backgroundColor: price.is_active ? '#10B98120' : '#EF444420',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                gap: 4,
              }}
            >
              <Ionicons
                name={price.is_active ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={price.is_active ? '#10B981' : '#EF4444'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: price.is_active ? '#10B981' : '#EF4444',
                }}
              >
                {price.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>

            {price.is_approved && (
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

            {price.source && (
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
                <Ionicons name="information-circle" size={14} color={theme.colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>
                  {price.source}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Price Details */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors['text-primary'],
              marginBottom: 12,
            }}
          >
            Price Information
          </Text>

          <View style={{ gap: 12 }}>
            <DetailRow label="Store" value={price.store_name} />
            <DetailRow label="Location" value={price.store_location} />
            <DetailRow label="Product" value={price.product_name} />
            <DetailRow 
              label="Date Recorded" 
              value={new Date(price.date_recorded).toLocaleDateString()} 
            />
            <DetailRow 
              label="Created" 
              value={new Date(price.created_at).toLocaleDateString()} 
            />
            {price.created_by_username && (
              <DetailRow label="Created By" value={price.created_by_username} />
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/profile/admin/prices/edit/[id]",
                params: { id: price.id },
              })
            }
            disabled={isActioning}
          >
            <Button
              title="Edit Price"
              onPress={() => {}}
              variant="secondary"
              fullWidth
              size="lg"
            />
          </TouchableOpacity>

          {!price.is_approved && (
            <>
              <Button
                title="Approve Price"
                onPress={handleApprove}
                loading={isActioning}
                fullWidth
                size="lg"
              />
              <Button
                title="Reject Price"
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