// mobile/components/receipts/ReceiptCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReceiptListItem } from '../../services/receiptService';
import { Card } from '../ui/Card';

interface ReceiptCardProps {
  receipt: ReceiptListItem;
  onPress: () => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, onPress }) => {
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
        return 'bg-success/20 text-success';
      case 'processing':
        return 'bg-warning/20 text-warning';
      case 'failed':
        return 'bg-error/20 text-error';
      default:
        return 'bg-text-muted/20 text-text-muted';
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

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="flex-row bg-surface">
        {/* Receipt Thumbnail */}
        <View className="mr-3">
          {receipt.receipt_thumbnail_url ? (
            <Image
              source={{ uri: receipt.receipt_thumbnail_url }}
              className="w-20 h-24 rounded-lg bg-surface-light"
              resizeMode="cover"
            />
          ) : (
            <View className="w-20 h-24 rounded-lg bg-surface-light items-center justify-center">
              <Ionicons name="receipt-outline" size={32} color="#9ca3af" />
            </View>
          )}
        </View>

        {/* Receipt Info */}
        <View className="flex-1">
          {/* Store Name */}
          <Text className="text-base font-semibold text-text-primary mb-1" numberOfLines={1}>
            {receipt.store_name || 'Unknown Store'}
          </Text>

          {/* Store Location */}
          {receipt.store_location && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="location-outline" size={14} color="#9ca3af" />
              <Text className="text-sm text-text-secondary ml-1" numberOfLines={1}>
                {receipt.store_location}
              </Text>
            </View>
          )}

          {/* Date and Items Count */}
          <View className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text className="text-sm text-text-secondary ml-1">
              {formatDate(receipt.purchase_date)}
            </Text>
            <Text className="text-text-muted mx-2">•</Text>
            <Ionicons name="list-outline" size={14} color="#9ca3af" />
            <Text className="text-sm text-text-secondary ml-1">
              {receipt.items_count} {receipt.items_count === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {/* Amount and Status */}
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-primary">
              {formatAmount(receipt.total_amount)}
            </Text>
            <View
              className={`flex-row items-center px-2 py-1 rounded-full ${getStatusColor(
                receipt.status
              )}`}
            >
              <Ionicons
                name={getStatusIcon(receipt.status) as any}
                size={12}
                color="currentColor"
              />
              <Text className="text-xs font-medium ml-1 capitalize">
                {receipt.status}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};