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
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import receiptService, { ReceiptListItem } from '../../../services/receiptService';
import { ReceiptCard } from '../../../components/receipts/ReceiptCard';
import { ReceiptFilters, FilterValues } from '../../../components/receipts/ReceiptFilters';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { useTheme } from '../../../context/ThemeContext';

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

  const { theme } = useTheme();

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.colors['surface-light'], borderRadius: 9999, padding: 24, marginBottom: 16 }}>
            <Ionicons name="search-outline" size={64} color={theme.colors['text-muted']} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors['text-primary'], marginBottom: 8 }}>
            No Receipts Found
          </Text>
          <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center', marginBottom: 24 }}>
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: `${theme.colors.primary}20`, borderRadius: 9999, padding: 24, marginBottom: 16 }}>
          <Ionicons name="receipt-outline" size={64} color={theme.colors.primary} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors['text-primary'], marginBottom: 8 }}>
          No Receipts Yet
        </Text>
        <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center', marginBottom: 24 }}>
          Start by uploading your first receipt to track your grocery spending
        </Text>
        <Button
          title="Upload Receipt"
          onPress={handleUploadPress}
          variant="primary"
        />
      </View>
    );
  };

  // Render footer
  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>
        {/* Header with Search and Filters - Removed title since layout handles it */}
        <View style={{ 
          paddingHorizontal: 16, 
          paddingVertical: 12, 
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border
        }}>
          {/* Receipt count and upload button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ color: theme.colors['text-secondary'], fontSize: 14 }}>
                {receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleUploadPress}
              style={{ backgroundColor: theme.colors.primary, borderRadius: 9999, padding: 12 }}
            >
              <Ionicons name="camera" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Search by store name..."
                value={searchQuery}
                onChangeText={handleSearch}
                icon="search-outline"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
                borderWidth: 2,
                borderRadius: 8,
                backgroundColor: activeFilterCount > 0 ? theme.colors.primary : theme.colors.surface,
                borderColor: activeFilterCount > 0 ? theme.colors.primary : theme.colors['border-light'],
              }}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name="filter"
                  size={24}
                  color={activeFilterCount > 0 ? theme.colors['text-primary'] : theme.colors['text-muted']}
                />
                {activeFilterCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    backgroundColor: theme.colors['text-primary'],
                    borderRadius: 9999,
                    width: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' }}>
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
          <View style={{ 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            backgroundColor: theme.colors['surface-light'] 
          }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {searchQuery && (
                <View style={{ 
                  backgroundColor: `${theme.colors.primary}20`, 
                  paddingHorizontal: 12, 
                  paddingVertical: 4, 
                  borderRadius: 9999, 
                  flexDirection: 'row', 
                  alignItems: 'center' 
                }}>
                  <Text style={{ color: theme.colors.primary, fontSize: 14, marginRight: 4 }}>
                    Store: {searchQuery}
                  </Text>
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {filters.status && (
                <View style={{ 
                  backgroundColor: `${theme.colors.primary}20`, 
                  paddingHorizontal: 12, 
                  paddingVertical: 4, 
                  borderRadius: 9999, 
                  flexDirection: 'row', 
                  alignItems: 'center' 
                }}>
                  <Text style={{ color: theme.colors.primary, fontSize: 14, marginRight: 4, textTransform: 'capitalize' }}>
                    {filters.status}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFilters((prev) => ({ ...prev, status: '' }))}
                  >
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {(filters.startDate || filters.endDate) && (
                <View style={{ 
                  backgroundColor: `${theme.colors.primary}20`, 
                  paddingHorizontal: 12, 
                  paddingVertical: 4, 
                  borderRadius: 9999, 
                  flexDirection: 'row', 
                  alignItems: 'center' 
                }}>
                  <Text style={{ color: theme.colors.primary, fontSize: 14, marginRight: 4 }}>
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
                    <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                onPress={clearFilters}
                style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 14, fontWeight: '500' }}>Clear all</Text>
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

      {/* Filters Modal */}
      <ReceiptFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </View>
  );
}