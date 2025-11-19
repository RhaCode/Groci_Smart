// mobile/components/lists/ListItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListItem } from '../../services/shoppingListService';

interface ListItemProps {
  item: ShoppingListItem;
  onToggle: () => void;
  onPress?: () => void;
  showBorder?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  item,
  onToggle,
  onPress,
  showBorder = true,
}) => {
  const formatAmount = (amount: string | null) => {
    if (!amount) return null;
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const totalPrice = item.estimated_price
    ? (parseFloat(item.quantity) * parseFloat(item.estimated_price)).toFixed(2)
    : null;

  return (
    <View
      className={`flex-row items-start py-3 ${
        showBorder ? 'border-b border-border' : ''
      }`}
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        className="mr-3 mt-1"
      >
        <View
          className={`w-6 h-6 rounded-md border-2 items-center justify-center ${
            item.is_checked
              ? 'bg-accent border-accent'
              : 'border-border-light'
          }`}
        >
          {item.is_checked && <Ionicons name="checkmark" size={16} color="#f9fafb" />}
        </View>
      </TouchableOpacity>

      {/* Item Content */}
      <TouchableOpacity
        onPress={onPress}
        className="flex-1"
        disabled={!onPress}
      >
        <View className="flex-row justify-between items-start mb-1">
          <Text
            className={`flex-1 text-base ${
              item.is_checked
                ? 'text-text-muted line-through'
                : 'text-text-primary font-medium'
            }`}
            numberOfLines={2}
          >
            {item.product_name}
          </Text>
          {totalPrice && (
            <Text
              className={`ml-2 font-semibold ${
                item.is_checked ? 'text-text-muted' : 'text-text-primary'
              }`}
            >
              ${totalPrice}
            </Text>
          )}
        </View>

        {/* Item Details */}
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="flex-row items-center">
            <Ionicons name="cube-outline" size={14} color="#9ca3af" />
            <Text className="text-sm text-text-secondary ml-1">
              Qty: {parseFloat(item.quantity).toString()}
              {item.unit && ` ${item.unit}`}
            </Text>
          </View>

          {item.estimated_price && (
            <>
              <Text className="text-text-muted">•</Text>
              <View className="flex-row items-center">
                <Ionicons name="pricetag-outline" size={14} color="#9ca3af" />
                <Text className="text-sm text-text-secondary ml-1">
                  {formatAmount(item.estimated_price)} each
                </Text>
              </View>
            </>
          )}

          {item.product_details?.lowest_price && (
            <>
              <Text className="text-text-muted">•</Text>
              <Text className="text-xs text-success">
                Best: ${item.product_details.lowest_price.toFixed(2)}
              </Text>
            </>
          )}
        </View>

        {item.notes && (
          <Text className="text-sm text-text-muted italic mt-1">{item.notes}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};