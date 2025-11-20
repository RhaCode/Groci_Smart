// mobile/components/receipts/ReceiptItem.tsx
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { ReceiptItem as ReceiptItemType } from '../../services/receiptService';
import { useTheme } from '../../context/ThemeContext';

interface ReceiptItemProps {
  item: ReceiptItemType;
  showBorder?: boolean;
}

export const ReceiptItemComponent: React.FC<ReceiptItemProps> = ({
  item,
  showBorder = true,
}) => {
  const { theme } = useTheme();

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const containerStyle: ViewStyle = {
    paddingVertical: 12,
    borderBottomWidth: showBorder ? 1 : 0,
    borderBottomColor: showBorder ? theme.colors.border : 'transparent',
  };

  return (
    <View style={containerStyle}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 4 
      }}>
        <Text 
          style={{ 
            flex: 1, 
            color: theme.colors['text-primary'], 
            fontWeight: '500' 
          }} 
          numberOfLines={2}
        >
          {item.product_name}
        </Text>
        <Text style={{ 
          color: theme.colors['text-primary'], 
          fontWeight: '600', 
          marginLeft: 8 
        }}>
          {formatAmount(item.total_price)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ 
          fontSize: 14, 
          color: theme.colors['text-secondary'] 
        }}>
          Qty: {parseFloat(item.quantity).toString()}
        </Text>
        <Text style={{ 
          color: theme.colors['text-muted'], 
          marginHorizontal: 8 
        }}>
          •
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: theme.colors['text-secondary'] 
        }}>
          Unit: {formatAmount(item.unit_price)}
        </Text>
        {item.category && (
          <>
            <Text style={{ 
              color: theme.colors['text-muted'], 
              marginHorizontal: 8 
            }}>
              •
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: theme.colors['text-secondary'] 
            }}>
              {item.category}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};