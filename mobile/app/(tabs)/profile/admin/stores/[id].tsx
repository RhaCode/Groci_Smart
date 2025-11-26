// mobile/app/(tabs)/profile/admin/stores/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Store } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

export default function AdminStoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchStore = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await productService.getStoreById(parseInt(id));
      setStore(data);
    } catch (err: any) {
      console.error('Error fetching store:', err);
      setError(err.message || 'Failed to load store');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStore();
    }, [id])
  );

  const onRefresh = () => {
    fetchStore(true);
  };

  const handleApprove = async () => {
    if (!store) return;

    Alert.alert('Approve Store', 'Are you sure you want to approve this store?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            setIsActioning(true);
            await productService.approveStore(store.id);
            Alert.alert('Success', 'Store approved successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to approve store');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!store) return;

    Alert.alert('Reject Store', 'Are you sure you want to reject this store?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        onPress: async () => {
          try {
            setIsActioning(true);
            await productService.rejectStore(store.id);
            Alert.alert('Success', 'Store rejected successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject store');
          } finally {
            setIsActioning(false);
          }
        },
      },
    ]);
  };

  const handleOpenMaps = () => {
    if (!store?.latitude || !store?.longitude) return;
    
    const url = `https://maps.google.com/?q=${store.latitude},${store.longitude}`;
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not open maps application')
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading store..." fullScreen />;
  }

  if (error || !store) {
    return <ErrorMessage message={error || 'Store not found'} onRetry={() => fetchStore()} />;
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
                {store.name}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: theme.colors['text-secondary'],
                  marginBottom: 8,
                }}
              >
                {store.location}
              </Text>
            </View>
            {!store.is_approved && (
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
                backgroundColor: store.is_active ? '#10B98120' : '#EF444420',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                gap: 4,
              }}
            >
              <Ionicons
                name={store.is_active ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={store.is_active ? '#10B981' : '#EF4444'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: store.is_active ? '#10B981' : '#EF4444',
                }}
              >
                {store.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>

            {store.is_approved && (
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

        {/* Store Details */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors['text-primary'],
              marginBottom: 12,
            }}
          >
            Store Information
          </Text>

          <View style={{ gap: 12 }}>
            <DetailRow label="Location" value={store.location} />
            {store.address && <DetailRow label="Address" value={store.address} />}
            
              <TouchableOpacity
                onPress={handleOpenMaps}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <Text style={{ color: theme.colors['text-secondary'], flex: 1 }}>
                  Coordinates
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontWeight: '500',
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {(store.latitude && typeof store.latitude === 'number' ? store.latitude.toFixed(6) : 'N/A')}, {(store.longitude && typeof store.longitude === 'number' ? store.longitude.toFixed(6) : 'N/A')}
                  </Text>
                  <Ionicons name="navigate" size={16} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
           
            
            <DetailRow
              label="Created"
              value={new Date(store.created_at).toLocaleDateString()}
            />
            {store.created_by_username && (
              <DetailRow label="Created By" value={store.created_by_username} />
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/profile/admin/stores/edit/[id]',
                params: { id: store.id },
              })
            }
            disabled={isActioning}
          >
            <Button
              title="Edit Store"
              onPress={() => {}}
              variant="secondary"
              fullWidth
              size="lg"
            />
          </TouchableOpacity>

          {!store.is_approved && (
            <>
              <Button
                title="Approve Store"
                onPress={handleApprove}
                loading={isActioning}
                fullWidth
                size="lg"
              />
              <Button
                title="Reject Store"
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