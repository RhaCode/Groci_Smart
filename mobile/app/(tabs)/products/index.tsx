// mobile/app/(tabs)/products/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { ProductSummary } from '../../../services/productService';
import { ProductCard } from '@/components/products/ProductCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

export default function ProductsScreen() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products
  const fetchProducts = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setError(null);
      } else if (pageNum === 1) {
        setIsLoading(true);
        setError(null);
      }

      const response = await productService.getProducts({ page: pageNum });

      if (refresh || pageNum === 1) {
        setProducts(response.results);
      } else {
        setProducts((prev) => [...prev, ...response.results]);
      }

      setHasMore(response.next !== null);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts(1);
    }, [])
  );

  const onRefresh = () => {
    fetchProducts(1, true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchProducts(page + 1);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/products/search?query=${searchQuery}`);
    }
  };

  const handleProductPress = (productId: number) => {
    router.push({
      pathname: '/(tabs)/products/[id]',
      params: { id: productId },
    });
  };

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 justify-center items-center p-6">
        <View className="bg-primary/20 rounded-full p-6 mb-4">
          <Ionicons name="pricetag-outline" size={64} color="#0ea5e9" />
        </View>
        <Text className="text-xl font-bold text-text-primary mb-2">
          No Products Found
        </Text>
        <Text className="text-text-secondary text-center">
          Browse or search for products to track prices
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#0ea5e9" />
      </View>
    );
  };

  if (isLoading && products.length === 0) {
    return <LoadingSpinner message="Loading products..." fullScreen />;
  }

  if (error && products.length === 0) {
    return <ErrorMessage message={error} onRetry={() => fetchProducts(1)} />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Search Bar */}
      <View className="px-4 py-3 bg-surface border-b border-border">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-background rounded-lg px-3 border border-border">
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 py-2 text-text-primary"
              placeholder="Search products..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-primary p-2 rounded-lg"
          >
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => handleProductPress(item.id)} />
        )}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#0ea5e9']}
            tintColor="#0ea5e9"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}