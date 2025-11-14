// mobile/components/receipts/ReceiptItem.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { ReceiptItem as ReceiptItemType } from '../../services/receiptService';

interface ReceiptItemProps {
  item: ReceiptItemType;
  showBorder?: boolean;
}

export const ReceiptItemComponent: React.FC<ReceiptItemProps> = ({
  item,
  showBorder = true,
}) => {
  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <View
      className={`py-3 ${showBorder ? 'border-b border-gray-200' : ''}`}
    >
      <View className="flex-row justify-between items-start mb-1">
        <Text className="flex-1 text-gray-800 font-medium" numberOfLines={2}>
          {item.product_name}
        </Text>
        <Text className="text-gray-800 font-semibold ml-2">
          {formatAmount(item.total_price)}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Text className="text-sm text-gray-600">
          Qty: {parseFloat(item.quantity).toString()}
        </Text>
        <Text className="text-gray-400 mx-2">•</Text>
        <Text className="text-sm text-gray-600">
          Unit: {formatAmount(item.unit_price)}
        </Text>
        {item.category && (
          <>
            <Text className="text-gray-400 mx-2">•</Text>
            <Text className="text-sm text-gray-600">{item.category}</Text>
          </>
        )}
      </View>
    </View>
  );
};