// mobile/components/lists/ShoppingListCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListSummary } from '../../services/shoppingListService';
import { Card } from '../ui/Card';

interface ShoppingListCardProps {
  list: ShoppingListSummary;
  onPress: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const ShoppingListCard: React.FC<ShoppingListCardProps> = ({
  list,
  onPress,
  onDelete,
  onDuplicate,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-primary'; // primary color
      case 'completed':
        return 'text-success'; // success color
      case 'archived':
        return 'text-text-muted'; // muted color
      default:
        return 'text-text-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'time-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'archived':
        return 'archive-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary'; // primary color for active lists
      case 'completed':
        return 'bg-success'; // success color for completed lists
      case 'archived':
        return 'bg-text-muted'; // muted color for archived lists
      default:
        return 'bg-primary';
    }
  };

  const handleMenuPress = () => {
    Alert.alert(
      list.name,
      'Choose an action',
      [
        { text: 'View', onPress },
        onDuplicate && { text: 'Duplicate', onPress: onDuplicate },
        onDelete && {
          text: 'Delete',
          onPress: onDelete,
          style: 'destructive',
        },
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any
    );
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="relative bg-surface">
        {/* Menu Button */}
        <TouchableOpacity
          onPress={handleMenuPress}
          className="absolute top-3 right-3 p-2"
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* List Name */}
        <Text className="text-lg font-bold text-text-primary mb-2 pr-8" numberOfLines={1}>
          {list.name}
        </Text>

        {/* Progress Bar */}
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-sm text-text-secondary">
              {list.checked_items_count} of {list.items_count} items
            </Text>
            <Text className="text-sm font-semibold text-accent">
              {list.progress_percentage}%
            </Text>
          </View>
          <View className="h-2 bg-surface-light rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${getProgressBarColor(list.status)}`}
              style={{ width: `${list.progress_percentage}%` }}
            />
          </View>
        </View>

        {/* Footer Info */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons
              name={getStatusIcon(list.status) as any}
              size={16}
              color="currentColor"
              className={getStatusColor(list.status)}
            />
            <Text className={`text-sm ml-1 capitalize ${getStatusColor(list.status)}`}>
              {list.status}
            </Text>
          </View>

          {parseFloat(list.estimated_total) > 0 && (
            <Text className="text-lg font-bold text-text-primary">
              {formatAmount(list.estimated_total)}
            </Text>
          )}
        </View>

        {/* Updated Time */}
        <Text className="text-xs text-text-muted mt-2">
          Updated {new Date(list.updated_at).toLocaleDateString()}
        </Text>
      </Card>
    </TouchableOpacity>
  );
};