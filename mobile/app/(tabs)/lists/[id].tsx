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
import shoppingListService, { ShoppingList } from '../../../services/shoppingListService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { ListItem } from '../../../components/lists/ListItem';
import { ListProgress } from '../../../components/lists/ListProgress';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

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

  const handleCompareprices = () => {
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
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => fetchList(true)}
            colors={['#e879f9']}
            tintColor="#e879f9"
          />
        }
      >
        {/* List Header */}
        <Card className="mb-4 bg-surface">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-text-primary mb-1">
                {list.name}
              </Text>
              {list.notes && (
                <Text className="text-text-secondary text-sm">{list.notes}</Text>
              )}
            </View>
            <TouchableOpacity onPress={handleEditList} className="p-2">
              <Ionicons name="pencil" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Estimated Total */}
          {parseFloat(list.estimated_total) > 0 && (
            <View className="flex-row justify-between items-center pt-3 border-t border-border">
              <Text className="text-text-secondary">Estimated Total</Text>
              <Text className="text-2xl font-bold text-accent">
                {formatAmount(list.estimated_total)}
              </Text>
            </View>
          )}
        </Card>

        {/* Progress */}
        {list.items_count > 0 && (
          <View className="mb-4">
            <ListProgress
              itemsCount={list.items_count}
              checkedCount={list.checked_items_count}
              percentage={list.progress_percentage}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-2 mb-4">
          <Button
            title="Add Item"
            onPress={handleAddItem}
            variant="secondary"
            className="flex-1"
          />
          {list.items_count > 0 && (
            <Button
              title="Compare Prices"
              onPress={handleCompareprices}
              variant="primary"
              className="flex-1"
            />
          )}
        </View>

        {/* Items List */}
        {list.items_count > 0 ? (
          <Card className="mb-4 bg-surface">
            {/* Unchecked Items */}
            {uncheckedItems.length > 0 && (
              <>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-semibold text-text-primary">
                    To Buy ({uncheckedItems.length})
                  </Text>
                </View>
                {uncheckedItems.map((item, index) => (
                  <ListItem
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggleItem(item.id)}
                    showBorder={index < uncheckedItems.length - 1 || checkedItems.length > 0}
                  />
                ))}
              </>
            )}

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => setShowCompleted(!showCompleted)}
                  className="flex-row justify-between items-center py-3 border-t border-border"
                >
                  <Text className="text-lg font-semibold text-text-secondary">
                    Completed ({checkedItems.length})
                  </Text>
                  <Ionicons
                    name={showCompleted ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>

                {showCompleted &&
                  checkedItems.map((item, index) => (
                    <ListItem
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggleItem(item.id)}
                      showBorder={index < checkedItems.length - 1}
                    />
                  ))}
              </>
            )}
          </Card>
        ) : (
          <Card className="items-center py-8 mb-4 bg-surface">
            <View className="bg-accent-light/20 rounded-full p-6 mb-4">
              <Ionicons name="cart-outline" size={48} color="#e879f9" />
            </View>
            <Text className="text-lg font-semibold text-text-primary mb-2">
              No Items Yet
            </Text>
            <Text className="text-text-secondary text-center mb-4">
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
          <View className="flex gap-3 mb-4">
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