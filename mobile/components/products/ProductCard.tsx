import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductSummary } from '@/services/productService';
import { Card } from '../ui/Card';
import { useTheme } from '@/context/ThemeContext';

// Product Card Component
export const ProductCard: React.FC<{
  product: ProductSummary;
  onPress: () => void;
}> = ({ product, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ backgroundColor: theme.colors.surface }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 4 
            }} numberOfLines={2}>
              {product.name}
            </Text>

            {product.brand && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="bookmark-outline" size={14} color={theme.colors['text-muted']} />
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.colors['text-secondary'], 
                  marginLeft: 4 
                }}>
                  {product.brand}
                </Text>
              </View>
            )}

            {product.category_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="folder-outline" size={14} color={theme.colors['text-muted']} />
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.colors['text-secondary'], 
                  marginLeft: 4 
                }}>
                  {product.category_name}
                </Text>
              </View>
            )}
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            {product.lowest_price ? (
              <>
                <Text style={{ 
                  fontSize: 14, 
                  color: theme.colors['text-secondary'], 
                  marginBottom: 4 
                }}>
                  Best Price
                </Text>
                <Text style={{ 
                  fontSize: 20, 
                  fontWeight: 'bold', 
                  color: theme.colors.primary 
                }}>
                  ${product.lowest_price.toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={{ 
                fontSize: 14, 
                color: theme.colors['text-muted'] 
              }}>
                No prices yet
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginTop: 12, 
          paddingTop: 12, 
          borderTopWidth: 1, 
          borderTopColor: theme.colors.border 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={{ 
              fontSize: 12, 
              color: theme.colors['text-secondary'] 
            }}>
              Available
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
};