
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
        showBorder ? 'border-b border-gray-200' : ''
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
              ? 'bg-secondary-600 border-secondary-600'
              : 'border-gray-300'
          }`}
        >
          {item.is_checked && <Ionicons name="checkmark" size={16} color="white" />}
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
                ? 'text-gray-500 line-through'
                : 'text-gray-800 font-medium'
            }`}
            numberOfLines={2}
          >
            {item.product_name}
          </Text>
          {totalPrice && (
            <Text
              className={`ml-2 font-semibold ${
                item.is_checked ? 'text-gray-500' : 'text-gray-800'
              }`}
            >
              ${totalPrice}
            </Text>
          )}
        </View>

        {/* Item Details */}
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="flex-row items-center">
            <Ionicons name="cube-outline" size={14} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              Qty: {parseFloat(item.quantity).toString()}
              {item.unit && ` ${item.unit}`}
            </Text>
          </View>

          {item.estimated_price && (
            <>
              <Text className="text-gray-400">•</Text>
              <View className="flex-row items-center">
                <Ionicons name="pricetag-outline" size={14} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-1">
                  {formatAmount(item.estimated_price)} each
                </Text>
              </View>
            </>
          )}

          {item.product_details?.lowest_price && (
            <>
              <Text className="text-gray-400">•</Text>
              <Text className="text-xs text-success-600">
                Best: ${item.product_details.lowest_price.toFixed(2)}
              </Text>
            </>
          )}
        </View>

        {item.notes && (
          <Text className="text-sm text-gray-500 italic mt-1">{item.notes}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
