// mobile/components/receipts/ReceiptCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReceiptListItem } from '../../services/receiptService';
import { Card } from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

interface ReceiptCardProps {
  receipt: ReceiptListItem;
  onPress: () => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, onPress }) => {
  const { theme } = useTheme();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: `${theme.colors.success}20`,
          color: theme.colors.success
        };
      case 'processing':
        return {
          backgroundColor: `${theme.colors.warning}20`,
          color: theme.colors.warning
        };
      case 'failed':
        return {
          backgroundColor: `${theme.colors.error}20`,
          color: theme.colors.error
        };
      default:
        return {
          backgroundColor: `${theme.colors['text-muted']}20`,
          color: theme.colors['text-muted']
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'processing':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'ellipse';
    }
  };

  const statusColors = getStatusColor(receipt.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ backgroundColor: theme.colors.surface, flexDirection: 'row' }}>
        {/* Receipt Thumbnail */}
        <View style={{ marginRight: 12 }}>
          {receipt.receipt_thumbnail_url ? (
            <Image
              source={{ uri: receipt.receipt_thumbnail_url }}
              style={{ 
                width: 80, 
                height: 96, 
                borderRadius: 8, 
                backgroundColor: theme.colors['surface-light'] 
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ 
              width: 80, 
              height: 96, 
              borderRadius: 8, 
              backgroundColor: theme.colors['surface-light'],
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ionicons name="receipt-outline" size={32} color={theme.colors['text-muted']} />
            </View>
          )}
        </View>

        {/* Receipt Info */}
        <View style={{ flex: 1 }}>
          {/* Store Name */}
          <Text 
            style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 4 
            }} 
            numberOfLines={1}
          >
            {receipt.store_name || 'Unknown Store'}
          </Text>

          {/* Store Location */}
          {receipt.store_location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="location-outline" size={14} color={theme.colors['text-muted']} />
              <Text 
                style={{ 
                  fontSize: 14, 
                  color: theme.colors['text-secondary'], 
                  marginLeft: 4 
                }} 
                numberOfLines={1}
              >
                {receipt.store_location}
              </Text>
            </View>
          )}

          {/* Date and Items Count */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors['text-muted']} />
            <Text style={{ fontSize: 14, color: theme.colors['text-secondary'], marginLeft: 4 }}>
              {formatDate(receipt.purchase_date)}
            </Text>
            <Text style={{ color: theme.colors['text-muted'], marginHorizontal: 8 }}>•</Text>
            <Ionicons name="list-outline" size={14} color={theme.colors['text-muted']} />
            <Text style={{ fontSize: 14, color: theme.colors['text-secondary'], marginLeft: 4 }}>
              {receipt.items_count} {receipt.items_count === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {/* Amount and Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>
              {formatAmount(receipt.total_amount)}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 9999,
                backgroundColor: statusColors.backgroundColor,
              }}
            >
              <Ionicons
                name={getStatusIcon(receipt.status) as any}
                size={12}
                color={statusColors.color}
              />
              <Text 
                style={{ 
                  fontSize: 12, 
                  fontWeight: '500', 
                  marginLeft: 4, 
                  color: statusColors.color,
                  textTransform: 'capitalize'
                }}
              >
                {receipt.status}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};