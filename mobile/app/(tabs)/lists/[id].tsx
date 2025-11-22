// mobile/app/(tabs)/lists/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import shoppingListService, { ShoppingList, ShoppingListItem } from '../../../services/shoppingListService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { ListItem } from '../../../components/lists/ListItem';
import { ListProgress } from '../../../components/lists/ListProgress';
import { useTheme } from '../../../context/ThemeContext';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    if (id) {
      fetchList();
    }
  }, [id]);

  const fetchList = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await shoppingListService.getShoppingListById(parseInt(id));
      setList(data);
    } catch (err: any) {
      console.error('Error fetching list:', err);
      setError(err.message || 'Failed to load list');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleItem = async (itemId: number) => {
    if (!list) return;

    try {
      const updatedItem = await shoppingListService.toggleItemChecked(list.id, itemId);
      
      // Update local state
      setList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? updatedItem : item
          ),
          checked_items_count: updatedItem.is_checked
            ? prev.checked_items_count + 1
            : prev.checked_items_count - 1,
          progress_percentage: Math.round(
            ((updatedItem.is_checked
              ? prev.checked_items_count + 1
              : prev.checked_items_count - 1) /
              prev.items_count) *
              100
          ),
        };
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleAddItem = () => {
    router.push(`/(tabs)/lists/add-item/${id}`);
  };

  const handleEditList = () => {
    router.push(`/(tabs)/lists/edit/${id}`);
  };

  const handleEditItem = (item: ShoppingListItem) => {
    if (!list) return;

    router.push(`/(tabs)/lists/edit-item/${list.id}-${item.id}`);
  };

  const handleDeleteItem = (item: ShoppingListItem) => {
    if (!list) return;

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.product_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoppingListService.deleteListItem(list.id, item.id);
              // Refresh the list
              fetchList();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleDeleteList = () => {
    if (!list) return;

    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${list.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoppingListService.deleteShoppingList(list.id);
              Alert.alert('Success', 'List deleted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete list');
            }
          },
        },
      ]
    );
  };

  const handleClearCompleted = () => {
    if (!list) return;

    const completedCount = list.items.filter((item) => item.is_checked).length;
    
    if (completedCount === 0) {
      Alert.alert('No Completed Items', 'There are no completed items to clear');
      return;
    }

    Alert.alert(
      'Clear Completed Items',
      `Remove ${completedCount} completed item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoppingListService.clearCheckedItems(list.id);
              fetchList();
              Alert.alert('Success', 'Completed items cleared');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to clear items');
            }
          },
        },
      ]
    );
  };

  const handleMarkComplete = async () => {
    if (!list) return;

    Alert.alert(
      'Mark List as Complete',
      'This will mark the entire list as completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await shoppingListService.updateShoppingList(list.id, {
                status: 'completed',
              });
              Alert.alert('Success', 'List marked as completed', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to update list');
            }
          },
        },
      ]
    );
  };

  const handleComparePrices = () => {
    router.push(`/(tabs)/lists/compare/${id}`);
  };

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading list..." fullScreen />;
  }

  if (error || !list) {
    return <ErrorMessage message={error || 'List not found'} onRetry={() => fetchList()} />;
  }

  const uncheckedItems = list.items.filter((item) => !item.is_checked);
  const checkedItems = list.items.filter((item) => item.is_checked);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => fetchList(true)}
            colors={[theme.colors.accent]}
            tintColor={theme.colors.accent}
          />
        }
      >
        {/* List Header */}
        <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors['text-primary'], marginBottom: 4 }}>
                {list.name}
              </Text>
              {list.notes && (
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 14 }}>{list.notes}</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={handleEditList} style={{ padding: 8 }}>
                <Ionicons name="pencil" size={20} color={theme.colors['text-muted']} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteList} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.warning} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Estimated Total */}
          {parseFloat(list.estimated_total) > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <Text style={{ color: theme.colors['text-secondary'] }}>Estimated Total</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.accent }}>
                {formatAmount(list.estimated_total)}
              </Text>
            </View>
          )}
        </Card>

        {/* Progress */}
        {list.items_count > 0 && (
          <View style={{ marginBottom: 16 }}>
            <ListProgress
              itemsCount={list.items_count}
              checkedCount={list.checked_items_count}
              percentage={list.progress_percentage}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Button
            title="Add Item"
            onPress={handleAddItem}
            variant="secondary"
            style={{ flex: 1 }}
          />
          {list.items_count > 0 && (
            <Button
              title="Compare Prices"
              onPress={handleComparePrices}
              variant="primary"
              style={{ flex: 1 }}
            />
          )}
        </View>

        {/* Items List */}
        {list.items_count > 0 ? (
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            {/* Unchecked Items */}
            {uncheckedItems.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-primary'] }}>
                    To Buy ({uncheckedItems.length})
                  </Text>
                </View>
                {uncheckedItems.map((item, index) => (
                  <ListItem
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggleItem(item.id)}
                    onEdit={() => handleEditItem(item)}
                    onDelete={() => handleDeleteItem(item)}
                    showBorder={index < uncheckedItems.length - 1 || checkedItems.length > 0}
                    showActions={true}
                  />
                ))}
              </>
            )}

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => setShowCompleted(!showCompleted)}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-secondary'] }}>
                    Completed ({checkedItems.length})
                  </Text>
                  <Ionicons
                    name={showCompleted ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors['text-muted']}
                  />
                </TouchableOpacity>

                {showCompleted &&
                  checkedItems.map((item, index) => (
                    <ListItem
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggleItem(item.id)}
                      onEdit={() => handleEditItem(item)}
                      onDelete={() => handleDeleteItem(item)}
                      showBorder={index < checkedItems.length - 1}
                      showActions={true}
                    />
                  ))}
              </>
            )}
          </Card>
        ) : (
          <Card style={{ alignItems: 'center', paddingVertical: 32, marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <View style={{ backgroundColor: `${theme.colors.accent}20`, borderRadius: 9999, padding: 24, marginBottom: 16 }}>
              <Ionicons name="cart-outline" size={48} color={theme.colors.accent} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors['text-primary'], marginBottom: 8 }}>
              No Items Yet
            </Text>
            <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center', marginBottom: 16 }}>
              Start adding items to your shopping list
            </Text>
            <Button
              title="Add First Item"
              onPress={handleAddItem}
              variant="secondary"
              size="sm"
            />
          </Card>
        )}

        {/* List Actions */}
        {list.items_count > 0 && (
          <View style={{ gap: 12, marginBottom: 16 }}>
            {checkedItems.length > 0 && (
              <Button
                title="Clear Completed Items"
                onPress={handleClearCompleted}
                variant="outline"
                fullWidth
              />
            )}
            {list.status === 'active' && (
              <Button
                title="Mark List as Complete"
                onPress={handleMarkComplete}
                variant="primary"
                fullWidth
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}