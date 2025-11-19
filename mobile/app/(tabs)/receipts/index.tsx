// mobile/app/(tabs)/receipts/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import receiptService, { ReceiptListItem } from '../../../services/receiptService';
import { ReceiptCard } from '../../../components/receipts/ReceiptCard';
import { ReceiptFilters, FilterValues } from '../../../components/receipts/ReceiptFilters';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Fetch receipts
  const fetchReceipts = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setError(null);
      } else if (pageNum === 1) {
        setIsLoading(true);
        setError(null);
      }

      // Combine search and filters
      const params: any = { page: pageNum };
      
      if (searchQuery) {
        params.store = searchQuery;
      }
      
      if (filters.status) {
        params.status = filters.status;
      }
      
      if (filters.startDate) {
        params.start_date = filters.startDate;
      }
      
      if (filters.endDate) {
        params.end_date = filters.endDate;
      }

      const response = await receiptService.getReceipts(params);

      if (refresh || pageNum === 1) {
        setReceipts(response.results);
      } else {
        setReceipts((prev) => [...prev, ...response.results]);
      }

      setHasMore(response.next !== null);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError(err.message || 'Failed to load receipts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load receipts on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchReceipts(1);
    }, [searchQuery, filters])
  );

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle filters
  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
    
    // Count active filters
    const count = Object.values(newFilters).filter((v) => v && v !== '').length;
    setActiveFilterCount(count);
  };

  // Pull to refresh
  const onRefresh = () => {
    fetchReceipts(1, true);
  };

  // Load more receipts
  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchReceipts(page + 1);
    }
  };

  // Navigate to receipt detail
  const handleReceiptPress = (receiptId: number) => {
    router.push(`/(tabs)/receipts/${receiptId}`);
  };

  // Navigate to upload
  const handleUploadPress = () => {
    router.push('/(tabs)/receipts/upload');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilters({});
    setActiveFilterCount(0);
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    // Check if empty due to filters
    if (activeFilterCount > 0 || searchQuery) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-gray-100 rounded-full p-6 mb-4">
            <Ionicons name="search-outline" size={64} color="#6b7280" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            No Receipts Found
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Try adjusting your search or filters
          </Text>
          <Button
            title="Clear Filters"
            onPress={clearFilters}
            variant="outline"
            size="sm"
          />
        </View>
      );
    }

    return (
      <View className="flex-1 justify-center items-center p-6">
        <View className="bg-primary-100 rounded-full p-6 mb-4">
          <Ionicons name="receipt-outline" size={64} color="#0284c7" />
        </View>
        <Text className="text-xl font-bold text-gray-800 mb-2">
          No Receipts Yet
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Start by uploading your first receipt to track your grocery spending
        </Text>
        <Button
          title="Upload Receipt"
          onPress={handleUploadPress}
        />
      </View>
    );
  };

  // Render footer
  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#0284c7" />
      </View>
    );
  };

  if (isLoading && receipts.length === 0) {
    return <LoadingSpinner message="Loading receipts..." fullScreen />;
  }

  if (error && receipts.length === 0) {
    return <ErrorMessage message={error} onRetry={() => fetchReceipts(1)} />;
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        {/* Header with Search and Filters */}
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-2xl font-bold text-gray-800">Receipts</Text>
              <Text className="text-gray-600 text-sm mt-1">
                {receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleUploadPress}
              className="bg-primary-600 rounded-full p-3"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                placeholder="Search by store name..."
                value={searchQuery}
                onChangeText={handleSearch}
                icon="search-outline"
                containerClassName="mb-0"
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              className={`items-center justify-center px-4 border-2 rounded-lg ${
                activeFilterCount > 0
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-gray-300'
              }`}
            >
              <View className="relative">
                <Ionicons
                  name="filter"
                  size={24}
                  color={activeFilterCount > 0 ? 'white' : '#6b7280'}
                />
                {activeFilterCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 items-center justify-center">
                    <Text className="text-primary-600 text-xs font-bold">
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters Chips */}
        {(activeFilterCount > 0 || searchQuery) && (
          <View className="px-4 py-2 bg-gray-50">
            <View className="flex-row flex-wrap gap-2">
              {searchQuery && (
                <View className="bg-primary-100 px-3 py-1 rounded-full flex-row items-center">
                  <Text className="text-primary-700 text-sm mr-1">
                    Store: {searchQuery}
                  </Text>
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#0284c7" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.status && (
                <View className="bg-primary-100 px-3 py-1 rounded-full flex-row items-center">
                  <Text className="text-primary-700 text-sm mr-1 capitalize">
                    {filters.status}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFilters((prev) => ({ ...prev, status: '' }))}
                  >
                    <Ionicons name="close-circle" size={16} color="#0284c7" />
                  </TouchableOpacity>
                </View>
              )}
              {(filters.startDate || filters.endDate) && (
                <View className="bg-primary-100 px-3 py-1 rounded-full flex-row items-center">
                  <Text className="text-primary-700 text-sm mr-1">
                    Date Range
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: '',
                        endDate: '',
                      }))
                    }
                  >
                    <Ionicons name="close-circle" size={16} color="#0284c7" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                onPress={clearFilters}
                className="px-3 py-1 rounded-full flex-row items-center"
              >
                <Text className="text-gray-600 text-sm font-medium">Clear all</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Receipts List */}
        <FlatList
          data={receipts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ReceiptCard receipt={item} onPress={() => handleReceiptPress(item.id)} />
          )}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      </View>

      {/* Filters Modal */}
      <ReceiptFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </SafeAreaView>
  );
}