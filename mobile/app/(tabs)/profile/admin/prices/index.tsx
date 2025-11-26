// mobile/app/(tabs)/profile/admin/prices/index.tsx
import React, { useState, useCallback } from 'react';
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
import productService, { PriceHistory } from '../../../../../services/productService';
import { Card } from '../../../../../components/ui/Card';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

interface FilterOptions {
  showPending: boolean;
  showApproved: boolean;
}

export default function AdminPricesScreen() {
  const { theme } = useTheme();
  const [prices, setPrices] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    showPending: true,
    showApproved: true,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchPrices = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setError(null);
      } else {
        setIsLoading(true);
        setError(null);
      }

      let allPrices: PriceHistory[] = [];

      // Fetch based on filter settings
      if (filters.showPending && filters.showApproved) {
        // Get all prices
        const response = await productService.getAllPrices();
        allPrices = response.results;
      } else if (filters.showPending) {
        // Get only pending prices
        const response = await productService.getAllPrices({ is_approved: false });
        allPrices = response.results;
      } else if (filters.showApproved) {
        // Get only approved prices
        const response = await productService.getAllPrices({ is_approved: true });
        allPrices = response.results;
      }

      setPrices(allPrices);
    } catch (err: any) {
      console.error('Error fetching prices:', err);
      setError(err.message || 'Failed to load prices');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPrices();
    }, [filters])
  );

  const onRefresh = () => {
    fetchPrices(true);
  };

  const handlePricePress = (priceId: number) => {
    router.push({
      pathname: '/(tabs)/profile/admin/prices/[id]',
      params: { id: priceId },
    });
  };

  const handleDeletePrice = (priceId: number, storeName: string) => {
    Alert.alert(
      'Delete Price',
      `Are you sure you want to delete the price at ${storeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await productService.deletePrice(priceId);
              Alert.alert('Success', 'Price deleted successfully');
              fetchPrices(true);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete price');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const filteredPrices = prices.filter((price) =>
    price.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    price.store_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPriceCard = ({ item }: { item: PriceHistory }) => (
    <TouchableOpacity
      onPress={() => handlePricePress(item.id)}
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
                ${item.price}
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
              <Ionicons name="business-outline" size={12} color={theme.colors['text-muted']} />
              <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                {item.store_name} • {item.store_location}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 }}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors['text-muted']} />
              <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                {new Date(item.date_recorded).toLocaleDateString()}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name={item.is_active ? 'checkmark-circle' : 'close-circle'}
                size={12}
                color={item.is_active ? theme.colors.success : theme.colors.error}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: item.is_active ? theme.colors.success : theme.colors.error,
                }}
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 12 }}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/profile/admin/prices/edit/[id]',
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
              onPress={() => handleDeletePrice(item.id, item.store_name)}
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

        {item.created_by_username && (
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={{ fontSize: 11, color: theme.colors['text-muted'] }}>
              Created by: {item.created_by_username}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    
    const message = !filters.showPending && !filters.showApproved
      ? 'Please select at least one filter option'
      : filters.showPending && !filters.showApproved
      ? 'No pending price approvals at the moment'
      : 'No prices found';

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
          <Ionicons name="pricetag-outline" size={64} color={theme.colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors['text-primary'],
            marginBottom: 8,
          }}
        >
          No Prices Found
        </Text>
        <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center', paddingHorizontal: 32 }}>
          {message}
        </Text>
      </View>
    );
  };

  if (isLoading && prices.length === 0) {
    return <LoadingSpinner message="Loading prices..." fullScreen />;
  }

  if (error && prices.length === 0) {
    return <ErrorMessage message={error} onRetry={() => fetchPrices()} />;
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
              placeholder="Search by store name or location..."
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

      {/* Prices List */}
      <FlatList
        data={filteredPrices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPriceCard}
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
        onPress={() => router.push('/(tabs)/profile/admin/prices/create')}
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