// mobile/app/(tabs)/profile/admin/products/index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { ProductSummary } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

interface FilterOptions {
  showPending: boolean;
  showApproved: boolean;
}

export default function AdminProductsScreen() {
  const { theme } = useTheme();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    showPending: true,
    showApproved: true,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setError(null);
      } else {
        setIsLoading(true);
        setError(null);
      }

      let allProducts: ProductSummary[] = [];

      if (filters.showPending) {
        const pending = await productService.getPendingProducts();
        allProducts = [...allProducts, ...pending];
      }

      if (filters.showApproved) {
        const approved = await productService.getProducts();
        allProducts = [...allProducts, ...approved.results];
      }

      // Remove duplicates by ID
      const uniqueProducts = Array.from(
        new Map(allProducts.map(p => [p.id, p])).values()
      );

      setProducts(uniqueProducts);
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
      fetchProducts();
    }, [filters])
  );

  const onRefresh = () => {
    fetchProducts(true);
  };

  const handleProductPress = (productId: number) => {
    router.push({
      pathname: '/(tabs)/profile/admin/products/[id]',
      params: { id: productId },
    });
  };

  const handleDeleteProduct = (productId: number, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await productService.deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully');
              fetchProducts(true);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete product');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductCard = ({ item }: { item: ProductSummary }) => (
    <TouchableOpacity
      onPress={() => handleProductPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.colors['text-primary'],
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {!item.is_approved && (
                <View
                  style={{
                    backgroundColor: '#FFA50080',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#FF8C00' }}>
                    Pending
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 }}>
              <Ionicons name="bookmark-outline" size={12} color={theme.colors['text-muted']} />
              <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                {item.brand}
              </Text>
            </View>

            {item.category_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 }}>
                <Ionicons name="folder-outline" size={12} color={theme.colors['text-muted']} />
                <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                  {item.category_name}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="pricetag-outline" size={12} color={theme.colors['text-muted']} />
                <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                  {item.lowest_price ? `$${item.lowest_price.toFixed(2)}` : 'No price'}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="cube-outline" size={12} color={theme.colors['text-muted']} />
                <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                  {item.unit || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 12 }}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/profile/admin/products/edit/[id]',
                  params: { id: item.id },
                })
              }
              style={{
                backgroundColor: theme.colors.primary,
                padding: 8,
                borderRadius: 6,
              }}
            >
              <Ionicons name="pencil" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteProduct(item.id, item.name)}
              style={{
                backgroundColor: '#EF4444',
                padding: 8,
                borderRadius: 6,
              }}
            >
              <Ionicons name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status indicator */}
        <View style={{ 
          marginTop: 8, 
          paddingTop: 8, 
          borderTopWidth: 1, 
          borderTopColor: theme.colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons
              name={item.is_approved ? 'checkmark-circle' : 'time-outline'}
              size={12}
              color={item.is_approved ? theme.colors.success : theme.colors.warning}
            />
            <Text
              style={{
                fontSize: 11,
                color: item.is_approved ? theme.colors.success : theme.colors.warning,
              }}
            >
              {item.is_approved ? 'Approved' : 'Pending Approval'}
            </Text>
          </View>
          
          {item.lowest_price && (
            <Text style={{ 
              fontSize: 11, 
              color: theme.colors['text-muted'],
              fontWeight: '500'
            }}>
              Lowest: ${item.lowest_price.toFixed(2)}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
        <View
          style={{
            backgroundColor: `${theme.colors.primary}20`,
            borderRadius: 9999,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <Ionicons name="cube-outline" size={64} color={theme.colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors['text-primary'],
            marginBottom: 8,
          }}
        >
          No Products Found
        </Text>
        <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center' }}>
          {filters.showPending && filters.showApproved 
            ? 'Create or import products to get started'
            : 'Try adjusting your filters to see more products'
          }
        </Text>
      </View>
    );
  };

  if (isLoading && products.length === 0) {
    return <LoadingSpinner message="Loading products..." fullScreen />;
  }

  if (error && products.length === 0) {
    return <ErrorMessage message={error} onRetry={() => fetchProducts()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.background,
              borderRadius: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="search-outline" size={20} color={theme.colors['text-muted']} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                paddingVertical: 8,
                color: theme.colors['text-primary'],
              }}
              placeholder="Search products..."
              placeholderTextColor={theme.colors['text-muted']}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: showFilters ? theme.colors.primary : theme.colors.surface,
              padding: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={showFilters ? 'white' : theme.colors['text-primary']}
            />
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View style={{ marginTop: 12, gap: 8 }}>
            <TouchableOpacity
              onPress={() =>
                setFilters((prev) => ({ ...prev, showPending: !prev.showPending }))
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                  backgroundColor: filters.showPending ? theme.colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                {filters.showPending && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>
                Pending Approval
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setFilters((prev) => ({ ...prev, showApproved: !prev.showApproved }))
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                  backgroundColor: filters.showApproved ? theme.colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                {filters.showApproved && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>
                Approved
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductCard}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Create Button */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/profile/admin/products/create')}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}