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

export default function SearchProductsScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <View className="flex-1 bg-background">
      <View className="px-4 py-3 bg-surface border-b border-border">
        <Text className="text-text-secondary">Results for "{query}"</Text>
        <Text className="text-lg font-semibold text-text-primary">
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
            <Card className="mx-4 mt-2 bg-surface">
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold">{item.name}</Text>
                  {item.brand && (
                    <Text className="text-sm text-text-secondary">{item.brand}</Text>
                  )}
                  {item.category_name && (
                    <Text className="text-xs text-text-muted mt-1">
                      {item.category_name}
                    </Text>
                  )}
                </View>
                <View className="items-end">
                  {item.lowest_price ? (
                    <>
                      <Text className="text-xs text-text-secondary mb-1">Best Price</Text>
                      <Text className="text-lg font-bold text-primary">
                        ${item.lowest_price.toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-xs text-text-muted">No prices</Text>
                  )}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-6">
            <View className="bg-primary/20 rounded-full p-6 mb-4">
              <Ionicons name="search-outline" size={48} color="#0ea5e9" />
            </View>
            <Text className="text-text-primary font-semibold mb-2">No Products Found</Text>
            <Text className="text-text-secondary text-center">
              Try a different search term
            </Text>
          </View>
        }
      />
    </View>
  );
}