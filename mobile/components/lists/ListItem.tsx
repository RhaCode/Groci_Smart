// mobile/components/lists/ListItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListItem } from '../../services/shoppingListService';
import { useTheme } from '../../context/ThemeContext';

interface ListItemProps {
  item: ShoppingListItem;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showBorder?: boolean;
  showActions?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  item,
  onToggle,
  onEdit,
  onDelete,
  showBorder = true,
  showActions = true,
}) => {
  const { theme } = useTheme();

  const formatAmount = (amount: string | null) => {
    if (!amount) return null;
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const totalPrice = item.estimated_price
    ? (parseFloat(item.quantity) * parseFloat(item.estimated_price)).toFixed(2)
    : null;

  const handleLongPress = () => {
    if (showActions && (onEdit || onDelete)) {
      Alert.alert(
        item.product_name,
        'Choose an action:',
        [
          { text: 'Cancel', style: 'cancel' },
          onEdit && { text: 'Edit', onPress: onEdit },
          onDelete && { 
            text: 'Delete', 
            style: 'destructive',
            onPress: onDelete
          },
        ].filter(Boolean) as any
      );
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: showBorder ? theme.colors.border : 'transparent'
      }}
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        style={{ marginRight: 12, marginTop: 2 }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: item.is_checked ? theme.colors.accent : 'transparent',
            borderColor: item.is_checked ? theme.colors.accent : theme.colors['border-light'],
          }}
        >
          {item.is_checked && <Ionicons name="checkmark" size={16} color={theme.colors['text-primary']} />}
        </View>
      </TouchableOpacity>

      {/* Item Content */}
      <TouchableOpacity
        onPress={onToggle}
        onLongPress={handleLongPress}
        style={{ flex: 1 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <Text
            style={{
              flex: 1,
              fontSize: 16,
              color: item.is_checked ? theme.colors['text-muted'] : theme.colors['text-primary'],
              fontWeight: item.is_checked ? 'normal' : '500',
              textDecorationLine: item.is_checked ? 'line-through' : 'none',
            }}
            numberOfLines={2}
          >
            {item.product_name}
          </Text>
          {totalPrice && (
            <Text
              style={{
                marginLeft: 8,
                fontWeight: '600',
                color: item.is_checked ? theme.colors['text-muted'] : theme.colors['text-primary'],
              }}
            >
              ${totalPrice}
            </Text>
          )}
        </View>

        {/* Item Details */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={14} color={theme.colors['text-muted']} />
            <Text style={{ fontSize: 14, color: theme.colors['text-secondary'], marginLeft: 4 }}>
              Qty: {parseFloat(item.quantity).toString()}
              {item.unit && ` ${item.unit}`}
            </Text>
          </View>

          {item.estimated_price && (
            <>
              <Text style={{ color: theme.colors['text-muted'] }}>•</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="pricetag-outline" size={14} color={theme.colors['text-muted']} />
                <Text style={{ fontSize: 14, color: theme.colors['text-secondary'], marginLeft: 4 }}>
                  {formatAmount(item.estimated_price)} each
                </Text>
              </View>
            </>
          )}

          {item.product_details?.lowest_price && (
            <>
              <Text style={{ color: theme.colors['text-muted'] }}>•</Text>
              <Text style={{ fontSize: 12, color: theme.colors.success }}>
                Best: ${item.product_details.lowest_price.toFixed(2)}
              </Text>
            </>
          )}
        </View>

        {item.notes && (
          <Text style={{ fontSize: 14, color: theme.colors['text-muted'], fontStyle: 'italic', marginTop: 4 }}>
            {item.notes}
          </Text>
        )}
      </TouchableOpacity>

      {/* Quick Actions (Visible on long press or always if needed) */}
      {showActions && (onEdit || onDelete) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={{ padding: 4, marginRight: 4 }}
            >
              <Ionicons name="pencil-outline" size={18} color={theme.colors['text-muted']} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={{ padding: 4 }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.warning} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};