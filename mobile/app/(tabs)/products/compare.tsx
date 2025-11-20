// mobile/app/(tabs)/products/compare.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { ProductPriceComparison } from '../../../services/productService';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { useTheme } from '../../../context/ThemeContext';

export default function CompareProductsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [comparison, setComparison] = useState<ProductPriceComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (productId) {
      fetchComparison();
    }
  }, [productId]);

  const fetchComparison = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.compareProductPrices(parseInt(productId));
      setComparison(data);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to load comparison');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Comparing prices..." fullScreen />;
  }

  if (error || !comparison) {
    return <ErrorMessage message={error || 'No data'} onRetry={fetchComparison} />;
  }

  const sortedPrices = [...comparison.prices].sort((a, b) => a.price - b.price);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView className="flex-1 p-4">
        {/* Product Info */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors['text-primary'], marginBottom: 4 }}>
            {comparison.product_name}
          </Text>
          {comparison.brand && (
            <Text style={{ color: theme.colors['text-secondary'], marginBottom: 12 }}>{comparison.brand}</Text>
          )}

          {/* Price Stats */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            paddingTop: 12, 
            borderTopWidth: 1, 
            borderTopColor: theme.colors.border 
          }}>
            <View>
              <Text style={{ color: theme.colors['text-secondary'], fontSize: 14, marginBottom: 4 }}>Lowest</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.success }}>
                ${comparison.lowest_price.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={{ color: theme.colors['text-secondary'], fontSize: 14, marginBottom: 4 }}>Highest</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.error }}>
                ${comparison.highest_price.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={{ color: theme.colors['text-secondary'], fontSize: 14, marginBottom: 4 }}>Save</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.primary }}>
                {comparison.savings_percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Store Comparison */}
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-primary'], marginBottom: 12 }}>
            Prices by Store
          </Text>

          {sortedPrices.map((price, index) => {
            const isBest = price.price === comparison.lowest_price;
            const isWorst = price.price === comparison.highest_price;

            return (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: isBest 
                    ? `${theme.colors.success}20` 
                    : isWorst 
                    ? `${theme.colors.error}20` 
                    : theme.colors.background,
                  borderWidth: 1,
                  borderColor: isBest 
                    ? theme.colors.success 
                    : isWorst 
                    ? theme.colors.error 
                    : theme.colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: '600',
                      color: isBest
                        ? theme.colors.success
                        : isWorst
                        ? theme.colors.error
                        : theme.colors['text-primary'],
                    }}
                  >
                    {price.store_name}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.colors['text-secondary'] }}>
                    {price.store_location}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: isBest
                      ? theme.colors.success
                      : isWorst
                      ? theme.colors.error
                      : theme.colors['text-primary'],
                  }}
                >
                  ${price.price.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
}