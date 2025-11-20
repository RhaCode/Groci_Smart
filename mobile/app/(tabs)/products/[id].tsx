// mobile/app/(tabs)/products/[id].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { Product } from '../../../services/productService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { useTheme } from '../../../context/ThemeContext';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView className="flex-1 p-4">
        {/* Product Info */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors['text-primary'], marginBottom: 8 }}>
            {product.name}
          </Text>

          {product.brand && (
            <Text style={{ fontSize: 18, color: theme.colors['text-secondary'], marginBottom: 12 }}>{product.brand}</Text>
          )}

          {/* Meta Info */}
          <View style={{ gap: 8 }}>
            {product.category_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="folder-outline" size={16} color={theme.colors.primary} />
                <Text style={{ color: theme.colors['text-secondary'], marginLeft: 8 }}>{product.category_name}</Text>
              </View>
            )}

            {product.unit && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cube-outline" size={16} color={theme.colors.primary} />
                <Text style={{ color: theme.colors['text-secondary'], marginLeft: 8 }}>{product.unit}</Text>
              </View>
            )}

            {product.barcode && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="barcode-outline" size={16} color={theme.colors.primary} />
                <Text style={{ color: theme.colors['text-secondary'], marginLeft: 8 }}>{product.barcode}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Current Prices */}
        {product.current_prices.length > 0 && (
          <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-primary'], marginBottom: 12 }}>
              Current Prices
            </Text>

            {product.current_prices.map((price, index) => (
              <View
                key={price.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: theme.colors.background,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>{price.store_name}</Text>
                  <Text style={{ fontSize: 14, color: theme.colors['text-secondary'] }}>{price.store_location}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>
                  ${parseFloat(price.price).toFixed(2)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Lowest Price */}
        {product.lowest_price && (
          <Card style={{ 
            backgroundColor: `${theme.colors.success}20`, 
            borderColor: `${theme.colors.success}50`,
            borderWidth: 1,
            marginBottom: 16 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="trophy" size={24} color={theme.colors.success} />
              <Text style={{ color: theme.colors.success, fontWeight: '600', marginLeft: 8 }}>Best Price</Text>
            </View>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 4 }}>{product.lowest_price.store}</Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.colors.success }}>
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
    </View>
  );
}