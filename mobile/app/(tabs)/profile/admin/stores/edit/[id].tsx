// mobile/app/(tabs)/profile/admin/stores/edit/[id].tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Store, StoreCreateData } from '../../../../../../services/productService';
import { Card } from '../../../../../../components/ui/Card';
import { Button } from '../../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../../context/ThemeContext';

export default function EditStoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<StoreCreateData>({
    name: '',
    location: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
  });

  const fetchStore = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const storeData = await productService.getStoreById(parseInt(id));
      setStore(storeData);

      // Populate form with existing data
      setFormData({
        name: storeData.name,
        location: storeData.location,
        address: storeData.address || '',
        latitude: storeData.latitude || undefined,
        longitude: storeData.longitude || undefined,
      });
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

  const handleInputChange = (field: keyof StoreCreateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberInputChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Store name is required');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Location is required');
      return false;
    }
    
    // Validate coordinates if provided
    if (formData.latitude !== undefined && (formData.latitude < -90 || formData.latitude > 90)) {
      Alert.alert('Error', 'Latitude must be between -90 and 90');
      return false;
    }
    if (formData.longitude !== undefined && (formData.longitude < -180 || formData.longitude > 180)) {
      Alert.alert('Error', 'Longitude must be between -180 and 180');
      return false;
    }
    
    // If one coordinate is provided, both should be provided
    if ((formData.latitude !== undefined && formData.longitude === undefined) ||
        (formData.longitude !== undefined && formData.latitude === undefined)) {
      Alert.alert('Error', 'Both latitude and longitude must be provided together');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await productService.updateStore(parseInt(id), formData);
      Alert.alert(
        'Success',
        'Store updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error updating store:', err);
      setError(err.message || 'Failed to update store');
      Alert.alert('Error', err.message || 'Failed to update store');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading store..." fullScreen />;
  }

  if (error || !store) {
    return <ErrorMessage message={error || 'Store not found'} onRetry={() => fetchStore()} />;
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
            Edit Store
          </Text>

          {/* Store Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Store Name *
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
              placeholder="Enter store name"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
          </View>

          {/* Location */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Location *
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
              placeholder="Enter location (e.g., City, State)"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
            />
          </View>

          {/* Address */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Address (Optional)
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
              placeholder="Enter full street address"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Coordinates */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Coordinates (Optional)
            </Text>
            <Text style={{ color: theme.colors['text-secondary'], fontSize: 12, marginBottom: 8 }}>
              Provide both latitude and longitude for map integration
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 12, marginBottom: 4 }}>
                  Latitude
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
                  placeholder="e.g., 40.7128"
                  placeholderTextColor={theme.colors['text-muted']}
                  value={formData.latitude?.toString() || ''}
                  onChangeText={(value) => handleNumberInputChange('latitude', value)}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 12, marginBottom: 4 }}>
                  Longitude
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
                  placeholder="e.g., -74.0060"
                  placeholderTextColor={theme.colors['text-muted']}
                  value={formData.longitude?.toString() || ''}
                  onChangeText={(value) => handleNumberInputChange('longitude', value)}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          </View>

          {/* Store Status */}
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

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: store.is_approved ? '#10B98120' : '#FFA50020',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons
                  name={store.is_approved ? 'checkmark-done' : 'time'}
                  size={14}
                  color={store.is_approved ? '#10B981' : '#FF8C00'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: store.is_approved ? '#10B981' : '#FF8C00',
                  }}
                >
                  {store.is_approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Update Store"
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
    </View>
  );
}