// mobile/components/receipts/ReceiptStatusBadge.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReceiptStatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  size?: 'sm' | 'md' | 'lg';
}

export const ReceiptStatusBadge: React.FC<ReceiptStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-success-100',
          text: 'text-success-700',
          icon: 'checkmark-circle',
          label: 'Completed',
        };
      case 'processing':
        return {
          bg: 'bg-warning-100',
          text: 'text-warning-700',
          icon: 'time',
          label: 'Processing',
        };
      case 'failed':
        return {
          bg: 'bg-error-100',
          text: 'text-error-700',
          icon: 'close-circle',
          label: 'Failed',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: 'ellipse',
          label: 'Pending',
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  }[size];

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20,
  }[size];

  return (
    <View
      className={`flex-row items-center rounded-full ${config.bg} ${sizeClasses}`}
    >
      <Ionicons name={config.icon as any} size={iconSize} color="currentColor" />
      <Text className={`${config.text} ${textSizeClasses} font-medium ml-1`}>
        {config.label}
      </Text>
    </View>
  );
};