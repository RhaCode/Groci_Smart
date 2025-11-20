
// mobile/app/(tabs)/products/[id].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Product } from '../../../services/productService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getProductById(parseInt(id));
      setProduct(data);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = () => {
    if (product) {
      router.push(`/(tabs)/products/compare?productId=${product.id}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading product..." fullScreen />;
  }

  if (error || !product) {
    return <ErrorMessage message={error || 'Product not found'} onRetry={fetchProduct} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 p-4">
        {/* Product Info */}
        <Card className="mb-4 bg-surface">
          <Text className="text-2xl font-bold text-text-primary mb-2">
            {product.name}
          </Text>

          {product.brand && (
            <Text className="text-lg text-text-secondary mb-3">{product.brand}</Text>
          )}

          {/* Meta Info */}
          <View className="space-y-2">
            {product.category_name && (
              <View className="flex-row items-center">
                <Ionicons name="folder-outline" size={16} color="#0ea5e9" />
                <Text className="text-text-secondary ml-2">{product.category_name}</Text>
              </View>
            )}

            {product.unit && (
              <View className="flex-row items-center">
                <Ionicons name="cube-outline" size={16} color="#0ea5e9" />
                <Text className="text-text-secondary ml-2">{product.unit}</Text>
              </View>
            )}

            {product.barcode && (
              <View className="flex-row items-center">
                <Ionicons name="barcode-outline" size={16} color="#0ea5e9" />
                <Text className="text-text-secondary ml-2">{product.barcode}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Current Prices */}
        {product.current_prices.length > 0 && (
          <Card className="mb-4 bg-surface">
            <Text className="text-lg font-semibold text-text-primary mb-3">
              Current Prices
            </Text>

            {product.current_prices.map((price, index) => (
              <View
                key={price.id}
                className={`flex-row justify-between items-center py-2 px-3 bg-background rounded-lg mb-2`}
              >
                <View>
                  <Text className="text-text-primary font-medium">{price.store_name}</Text>
                  <Text className="text-sm text-text-secondary">{price.store_location}</Text>
                </View>
                <Text className="text-lg font-bold text-primary">
                  ${parseFloat(price.price).toFixed(2)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Lowest Price */}
        {product.lowest_price && (
          <Card className="mb-4 bg-success/20 border border-success/30">
            <View className="flex-row items-center mb-2">
              <Ionicons name="trophy" size={24} color="#22c55e" />
              <Text className="text-success font-semibold ml-2">Best Price</Text>
            </View>
            <Text className="text-text-primary mb-1">{product.lowest_price.store}</Text>
            <Text className="text-3xl font-bold text-success">
              ${product.lowest_price.price.toFixed(2)}
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        {product.current_prices.length > 0 && (
          <Button
            title="Compare Prices"
            onPress={handleCompare}
            fullWidth
            size="lg"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}