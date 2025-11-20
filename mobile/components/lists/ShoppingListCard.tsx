// mobile/components/lists/ShoppingListCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListSummary } from '../../services/shoppingListService';
import { Card } from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'archived':
        return theme.colors['text-muted'];
      default:
        return theme.colors['text-muted'];
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
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'archived':
        return theme.colors['text-muted'];
      default:
        return theme.colors.primary;
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

  const statusColor = getStatusColor(list.status);
  const progressBarColor = getProgressBarColor(list.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ backgroundColor: theme.colors.surface, position: 'relative' }}>
        {/* Menu Button */}
        <TouchableOpacity
          onPress={handleMenuPress}
          style={{ position: 'absolute', top: 12, right: 12, padding: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors['text-muted']} />
        </TouchableOpacity>

        {/* List Name */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: theme.colors['text-primary'], 
          marginBottom: 8,
          paddingRight: 32
        }} numberOfLines={1}>
          {list.name}
        </Text>

        {/* Progress Bar */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 14, color: theme.colors['text-secondary'] }}>
              {list.checked_items_count} of {list.items_count} items
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.accent }}>
              {list.progress_percentage}%
            </Text>
          </View>
          <View style={{ 
            height: 8, 
            backgroundColor: theme.colors['surface-light'], 
            borderRadius: 9999, 
            overflow: 'hidden' 
          }}>
            <View
              style={{ 
                height: '100%', 
                borderRadius: 9999, 
                backgroundColor: progressBarColor,
                width: `${list.progress_percentage}%` 
              }}
            />
          </View>
        </View>

        {/* Footer Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={getStatusIcon(list.status) as any}
              size={16}
              color={statusColor}
            />
            <Text style={{ 
              fontSize: 14, 
              marginLeft: 4, 
              textTransform: 'capitalize',
              color: statusColor
            }}>
              {list.status}
            </Text>
          </View>

          {parseFloat(list.estimated_total) > 0 && (
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: theme.colors['text-primary'] 
            }}>
              {formatAmount(list.estimated_total)}
            </Text>
          )}
        </View>

        {/* Updated Time */}
        <Text style={{ 
          fontSize: 12, 
          color: theme.colors['text-muted'], 
          marginTop: 8 
        }}>
          Updated {new Date(list.updated_at).toLocaleDateString()}
        </Text>
      </Card>
    </TouchableOpacity>
  );
};