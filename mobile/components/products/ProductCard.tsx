import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductSummary } from '@/services/productService';
import { Card } from '../ui/Card';

// Product Card Component
export const ProductCard: React.FC<{
  product: ProductSummary;
  onPress: () => void;
}> = ({ product, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="bg-surface">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-text-primary mb-1" numberOfLines={2}>
              {product.name}
            </Text>

            {product.brand && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="bookmark-outline" size={14} color="#9ca3af" />
                <Text className="text-sm text-text-secondary ml-1">{product.brand}</Text>
              </View>
            )}

            {product.category_name && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="folder-outline" size={14} color="#9ca3af" />
                <Text className="text-sm text-text-secondary ml-1">{product.category_name}</Text>
              </View>
            )}
          </View>

          <View className="items-end">
            {product.lowest_price ? (
              <>
                <Text className="text-sm text-text-secondary mb-1">Best Price</Text>
                <Text className="text-xl font-bold text-primary">
                  ${product.lowest_price.toFixed(2)}
                </Text>
              </>
            ) : (
              <Text className="text-sm text-text-muted">No prices yet</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
          <View className="flex-row items-center gap-1">
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text className="text-xs text-text-secondary">Available</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#0ea5e9" />
        </View>
      </Card>
    </TouchableOpacity>
  );
};