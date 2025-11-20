// mobile/components/receipts/ReceiptStatusBadge.tsx
import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface ReceiptStatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  size?: 'sm' | 'md' | 'lg';
}

export const ReceiptStatusBadge: React.FC<ReceiptStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const { theme } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: `${theme.colors.success}20`,
          color: theme.colors.success,
          icon: 'checkmark-circle',
          label: 'Completed',
        };
      case 'processing':
        return {
          backgroundColor: `${theme.colors.warning}20`,
          color: theme.colors.warning,
          icon: 'time',
          label: 'Processing',
        };
      case 'failed':
        return {
          backgroundColor: `${theme.colors.error}20`,
          color: theme.colors.error,
          icon: 'close-circle',
          label: 'Failed',
        };
      default:
        return {
          backgroundColor: `${theme.colors['text-muted']}20`,
          color: theme.colors['text-muted'],
          icon: 'ellipse',
          label: 'Pending',
        };
    }
  };

  const config = getStatusConfig();
  
  const sizeStyles = {
    sm: { paddingHorizontal: 8, paddingVertical: 4 },
    md: { paddingHorizontal: 12, paddingVertical: 6 },
    lg: { paddingHorizontal: 16, paddingVertical: 8 },
  }[size];

  const textSizeStyles = {
    sm: { fontSize: 12 },
    md: { fontSize: 14 },
    lg: { fontSize: 16 },
  }[size];

  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20,
  }[size];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: config.backgroundColor,
    ...sizeStyles,
  };

  const textStyle: TextStyle = {
    color: config.color,
    fontWeight: '500',
    marginLeft: 4,
    ...textSizeStyles,
  };

  return (
    <View style={containerStyle}>
      <Ionicons name={config.icon as any} size={iconSize} color={config.color} />
      <Text style={textStyle}>
        {config.label}
      </Text>
    </View>
  );
};