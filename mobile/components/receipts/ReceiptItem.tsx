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
      className={`py-3 ${showBorder ? 'border-b border-border' : ''}`}
    >
      <View className="flex-row justify-between items-start mb-1">
        <Text className="flex-1 text-text-primary font-medium" numberOfLines={2}>
          {item.product_name}
        </Text>
        <Text className="text-text-primary font-semibold ml-2">
          {formatAmount(item.total_price)}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Text className="text-sm text-text-secondary">
          Qty: {parseFloat(item.quantity).toString()}
        </Text>
        <Text className="text-text-muted mx-2">•</Text>
        <Text className="text-sm text-text-secondary">
          Unit: {formatAmount(item.unit_price)}
        </Text>
        {item.category && (
          <>
            <Text className="text-text-muted mx-2">•</Text>
            <Text className="text-sm text-text-secondary">{item.category}</Text>
          </>
        )}
      </View>
    </View>
  );
};