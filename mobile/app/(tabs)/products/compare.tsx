
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

export default function CompareProductsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [comparison, setComparison] = useState<ProductPriceComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 p-4">
        {/* Product Info */}
        <Card className="mb-4 bg-surface">
          <Text className="text-2xl font-bold text-text-primary mb-1">
            {comparison.product_name}
          </Text>
          {comparison.brand && (
            <Text className="text-text-secondary mb-3">{comparison.brand}</Text>
          )}

          {/* Price Stats */}
          <View className="flex-row justify-between pt-3 border-t border-border">
            <View>
              <Text className="text-text-secondary text-sm mb-1">Lowest</Text>
              <Text className="text-xl font-bold text-success">
                ${comparison.lowest_price.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className="text-text-secondary text-sm mb-1">Highest</Text>
              <Text className="text-xl font-bold text-error">
                ${comparison.highest_price.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className="text-text-secondary text-sm mb-1">Save</Text>
              <Text className="text-xl font-bold text-primary">
                {comparison.savings_percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Store Comparison */}
        <Card className="bg-surface">
          <Text className="text-lg font-semibold text-text-primary mb-3">
            Prices by Store
          </Text>

          {sortedPrices.map((price, index) => {
            const isBest = price.price === comparison.lowest_price;
            const isWorst = price.price === comparison.highest_price;

            return (
              <View
                key={index}
                className={`flex-row justify-between items-center p-3 rounded-lg mb-2 ${
                  isBest
                    ? 'bg-success/20 border border-success'
                    : isWorst
                    ? 'bg-error/20 border border-error'
                    : 'bg-background border border-border'
                }`}
              >
                <View className="flex-1">
                  <Text
                    className={`font-semibold ${
                      isBest
                        ? 'text-success'
                        : isWorst
                        ? 'text-error'
                        : 'text-text-primary'
                    }`}
                  >
                    {price.store_name}
                  </Text>
                  <Text className="text-sm text-text-secondary">
                    {price.store_location}
                  </Text>
                </View>
                <Text
                  className={`text-lg font-bold ${
                    isBest
                      ? 'text-success'
                      : isWorst
                      ? 'text-error'
                      : 'text-text-primary'
                  }`}
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