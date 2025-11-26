// mobile/app/(tabs)/profile/admin/prices/edit/[id].tsx
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
import productService, { PriceHistory, AddPriceData } from '../../../../../../services/productService';
import { Card } from '../../../../../../components/ui/Card';
import { Button } from '../../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../../context/ThemeContext';

export default function EditPriceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [price, setPrice] = useState<PriceHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<AddPriceData>>({
    price: 0,
    date_recorded: '',
    source: '',
  });

  const fetchPrice = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Get all pending prices and find the one we want
      const pendingPrices = await productService.getPendingPrices();
      const foundPrice = pendingPrices.find(p => p.id === parseInt(id));

      if (!foundPrice) {
        // If not found in pending, try to find in approved prices
        const products = await productService.getProducts();
        let approvedPrice: PriceHistory | null = null;
        
        for (const product of products.results) {
          if (product.current_prices) {
            const priceMatch = product.current_prices.find(p => p.id === parseInt(id));
            if (priceMatch) {
              approvedPrice = priceMatch;
              break;
            }
          }
        }

        if (approvedPrice) {
          setPrice(approvedPrice);
          setFormData({
            price: parseFloat(approvedPrice.price),
            date_recorded: approvedPrice.date_recorded,
            source: approvedPrice.source,
          });
        } else {
          throw new Error('Price not found');
        }
      } else {
        setPrice(foundPrice);
        setFormData({
          price: parseFloat(foundPrice.price),
          date_recorded: foundPrice.date_recorded,
          source: foundPrice.source,
        });
      }
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

  const handleInputChange = (field: keyof AddPriceData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.price || formData.price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await productService.updatePrice(parseInt(id), formData);
      Alert.alert(
        'Success',
        'Price updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error updating price:', err);
      setError(err.message || 'Failed to update price');
      Alert.alert('Error', err.message || 'Failed to update price');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading price..." fullScreen />;
  }

  if (error || !price) {
    return <ErrorMessage message={error || 'Price not found'} onRetry={() => fetchPrice()} />;
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
            Edit Price
          </Text>

          {/* Price Display */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Current Price
            </Text>
            <View style={{ 
              backgroundColor: theme.colors.background, 
              padding: 16, 
              borderRadius: 8,
              alignItems: 'center'
            }}>
              <Text style={{ 
                fontSize: 24, 
                fontWeight: '700', 
                color: theme.colors.primary 
              }}>
                ${price.price}
              </Text>
              <Text style={{ 
                color: theme.colors['text-secondary'], 
                fontSize: 14,
                marginTop: 4
              }}>
                {price.store_name} • {price.store_location}
              </Text>
            </View>
          </View>

          {/* New Price */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              New Price *
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
                value={formData.price === 0 ? '' : formData.price?.toString()}
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

          {/* Price Status */}
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

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: price.is_approved ? '#10B98120' : '#FFA50020',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons
                  name={price.is_approved ? 'checkmark-done' : 'time'}
                  size={14}
                  color={price.is_approved ? '#10B981' : '#FF8C00'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: price.is_approved ? '#10B981' : '#FF8C00',
                  }}
                >
                  {price.is_approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Update Price"
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