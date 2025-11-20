// mobile/app/(tabs)/products/search.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { ProductSummary } from '../../../services/productService';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { useTheme } from '../../../context/ThemeContext';

export default function SearchProductsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (query) {
      fetchResults();
    }
  }, [query]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.searchProducts({ query });
      setResults(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductPress = (productId: number) => {
    router.push({
      pathname: '/(tabs)/products/[id]',
      params: { id: productId },
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Searching..." fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchResults} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
      }}>
        <Text style={{ color: theme.colors['text-secondary'] }}>Results for "{query}"</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-primary'] }}>
          {results.length} products found
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleProductPress(item.id)}
            activeOpacity={0.7}
          >
            <Card style={{ 
              marginHorizontal: 16, 
              marginTop: 8, 
              backgroundColor: theme.colors.surface 
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>{item.name}</Text>
                  {item.brand && (
                    <Text style={{ fontSize: 14, color: theme.colors['text-secondary'] }}>{item.brand}</Text>
                  )}
                  {item.category_name && (
                    <Text style={{ fontSize: 12, color: theme.colors['text-muted'], marginTop: 4 }}>
                      {item.category_name}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {item.lowest_price ? (
                    <>
                      <Text style={{ fontSize: 12, color: theme.colors['text-secondary'], marginBottom: 4 }}>Best Price</Text>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>
                        ${item.lowest_price.toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 12, color: theme.colors['text-muted'] }}>No prices</Text>
                  )}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-6">
            <View style={{ 
              backgroundColor: `${theme.colors.primary}20`, 
              borderRadius: 9999, 
              padding: 24, 
              marginBottom: 16 
            }}>
              <Ionicons name="search-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={{ color: theme.colors['text-primary'], fontWeight: '600', marginBottom: 8 }}>No Products Found</Text>
            <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center' }}>
              Try a different search term
            </Text>
          </View>
        }
      />
    </View>
  );
}