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
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import shoppingListService, { ShoppingListSummary } from '../../../services/shoppingListService';
import { ShoppingListCard } from '../../../components/lists/ShoppingListCard';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { useTheme } from '../../../context/ThemeContext';

export default function ShoppingListsScreen() {
  const [lists, setLists] = useState<ShoppingListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const { theme } = useTheme();

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ 
          backgroundColor: `${theme.colors.accent}20`, 
          borderRadius: 9999, 
          padding: 24, 
          marginBottom: 16 
        }}>
          <Ionicons name="list-outline" size={64} color={theme.colors.accent} />
        </View>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: theme.colors['text-primary'], 
          marginBottom: 8 
        }}>
          No {statusFilter} Lists
        </Text>
        <Text style={{ 
          color: theme.colors['text-secondary'], 
          textAlign: 'center', 
          marginBottom: 24 
        }}>
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
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={theme.colors.accent} />
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Status Filter Tabs - Keep this as it's functional UI, not navigation */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          {/* List count and stats */}
          <View>
            <Text style={{ 
              color: theme.colors['text-secondary'], 
              fontSize: 14 
            }}>
              {lists.length} {lists.length === 1 ? 'list' : 'lists'}
            </Text>
          </View>
          
          {/* Create List Button */}
          <TouchableOpacity
            onPress={handleCreateList}
            style={{ backgroundColor: theme.colors.accent, borderRadius: 9999, padding: 12 }}
          >
            <Ionicons name="add" size={24} color={theme.colors['text-primary']} />
          </TouchableOpacity>
        </View>

        {/* Status Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setStatusFilter(tab.value)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: statusFilter === tab.value
                  ? theme.colors.accent
                  : theme.colors['surface-light'],
              }}
            >
              <Text
                style={{
                  fontWeight: '500',
                  color: statusFilter === tab.value 
                    ? theme.colors['text-primary'] 
                    : theme.colors['text-secondary'],
                }}
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
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.accent]}
            tintColor={theme.colors.accent}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}