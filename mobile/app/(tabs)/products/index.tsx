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
import { ProductCard } from '../../../components/products/ProductCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { useTheme } from '../../../context/ThemeContext';

export default function ProductsScreen() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();

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
        <View 
          style={{ 
            backgroundColor: `${theme.colors.primary}20`, 
            borderRadius: 9999, 
            padding: 24, 
            marginBottom: 16 
          }}
        >
          <Ionicons name="pricetag-outline" size={64} color={theme.colors.primary} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors['text-primary'], marginBottom: 8 }}>
          No Products Found
        </Text>
        <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center' }}>
          Browse or search for products to track prices
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={theme.colors.primary} />
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Search Bar */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ 
            flex: 1, 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: theme.colors.background, 
            borderRadius: 8, 
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: theme.colors.border
          }}>
            <Ionicons name="search-outline" size={20} color={theme.colors['text-muted']} />
            <TextInput
              style={{ 
                flex: 1, 
                marginLeft: 8, 
                paddingVertical: 8, 
                color: theme.colors['text-primary'] 
              }}
              placeholder="Search products..."
              placeholderTextColor={theme.colors['text-muted']}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            style={{ 
              backgroundColor: theme.colors.primary, 
              padding: 8, 
              borderRadius: 8 
            }}
          >
            <Ionicons name="arrow-forward" size={20} color={theme.colors['text-primary']} />
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
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}