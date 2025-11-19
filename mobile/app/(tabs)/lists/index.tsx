// mobile/app/(tabs)/lists/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import shoppingListService, { ShoppingListSummary } from '../../../services/shoppingListService';
import { ShoppingListCard } from '../../../components/lists/ShoppingListCard';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

export default function ShoppingListsScreen() {
  const [lists, setLists] = useState<ShoppingListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');

  // Fetch lists
  const fetchLists = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setError(null);
      } else if (pageNum === 1) {
        setIsLoading(true);
        setError(null);
      }

      const response = await shoppingListService.getShoppingLists({
        status: statusFilter,
        page: pageNum,
      });

      if (refresh || pageNum === 1) {
        setLists(response.results);
      } else {
        setLists((prev) => [...prev, ...response.results]);
      }

      setHasMore(response.next !== null);
      setPage(pageNum);
    } catch (err: any) {
      console.error('Error fetching lists:', err);
      setError(err.message || 'Failed to load shopping lists');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load lists on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchLists(1);
    }, [statusFilter])
  );

  // Pull to refresh
  const onRefresh = () => {
    fetchLists(1, true);
  };

  // Load more
  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchLists(page + 1);
    }
  };

  // Navigate to list detail
  const handleListPress = (listId: number) => {
    router.push(`/(tabs)/lists/${listId}`);
  };

  // Navigate to create list
  const handleCreateList = () => {
    router.push('/(tabs)/lists/create');
  };

  // Delete list
  const handleDeleteList = (listId: number, listName: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${listName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoppingListService.deleteShoppingList(listId);
              setLists((prev) => prev.filter((list) => list.id !== listId));
              Alert.alert('Success', 'List deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete list');
            }
          },
        },
      ]
    );
  };

  // Duplicate list
  const handleDuplicateList = async (listId: number) => {
    try {
      await shoppingListService.duplicateShoppingList(listId);
      fetchLists(1, true);
      Alert.alert('Success', 'List duplicated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to duplicate list');
    }
  };

  // Status filter tabs
  const statusTabs = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Archived', value: 'archived' },
  ];

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View className="flex-1 justify-center items-center p-6">
        <View className="bg-secondary-100 rounded-full p-6 mb-4">
          <Ionicons name="list-outline" size={64} color="#c026d3" />
        </View>
        <Text className="text-xl font-bold text-gray-800 mb-2">
          No {statusFilter} Lists
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          {statusFilter === 'active'
            ? 'Create your first shopping list to get started'
            : `You don't have any ${statusFilter} lists`}
        </Text>
        {statusFilter === 'active' && (
          <Button
            title="Create List"
            onPress={handleCreateList}
            variant="secondary"
          />
        )}
      </View>
    );
  };

  // Render footer
  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#c026d3" />
      </View>
    );
  };

  if (isLoading && lists.length === 0) {
    return <LoadingSpinner message="Loading lists..." fullScreen />;
  }

  if (error && lists.length === 0) {
    return <ErrorMessage message={error} onRetry={() => fetchLists(1)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-2xl font-bold text-gray-800">Shopping Lists</Text>
              <Text className="text-gray-600 text-sm mt-1">
                {lists.length} {lists.length === 1 ? 'list' : 'lists'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCreateList}
              className="bg-secondary-600 rounded-full p-3"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Status Tabs */}
          <View className="flex-row gap-2">
            {statusTabs.map((tab) => (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 rounded-full ${
                  statusFilter === tab.value
                    ? 'bg-secondary-600'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-medium ${
                    statusFilter === tab.value ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lists */}
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ShoppingListCard
              list={item}
              onPress={() => handleListPress(item.id)}
              onDelete={() => handleDeleteList(item.id, item.name)}
              onDuplicate={() => handleDuplicateList(item.id)}
            />
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
    </SafeAreaView>
  );
}