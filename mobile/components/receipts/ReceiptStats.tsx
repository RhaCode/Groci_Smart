// mobile/components/receipts/ReceiptStats.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { useTheme } from '../../context/ThemeContext';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  subtitle?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
}) => {
  const { theme } = useTheme();

  return (
    <Card className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
      <View className="flex-row items-center mb-2">
        <View className={`${iconBg} rounded-full p-2 mr-2`}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={{ color: theme.colors['text-secondary'], fontSize: 12 }}>
          {label}
        </Text>
      </View>
      <Text 
        className="text-2xl font-bold mb-1"
        style={{ color: theme.colors['text-primary'] }}
      >
        {value}
      </Text>
      {subtitle && (
        <Text style={{ color: theme.colors['text-muted'], fontSize: 12 }}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
};

interface TopStoreCardProps {
  storeName: string;
  receiptCount: number;
  totalSpent: string;
  rank: number;
}

export const TopStoreCard: React.FC<TopStoreCardProps> = ({
  storeName,
  receiptCount,
  totalSpent,
  rank,
}) => {
  const { theme } = useTheme();

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return { 
          bg: `rgba(${hexToRgb(theme.colors.warning)}, 0.2)`,
          text: theme.colors.warning
        };
      case 2:
        return { 
          bg: `rgba(${hexToRgb(theme.colors['text-muted'])}, 0.2)`,
          text: theme.colors['text-muted']
        };
      case 3:
        return { 
          bg: `rgba(${hexToRgb(theme.colors['accent-light'])}, 0.2)`,
          text: theme.colors['accent-light']
        };
      default:
        return { 
          bg: `rgba(${hexToRgb(theme.colors.primary)}, 0.2)`,
          text: theme.colors['primary-light']
        };
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return 'trophy';
      case 2:
        return 'medal';
      case 3:
        return 'ribbon';
      default:
        return 'star';
    }
  };

  const rankColors = getRankColor(rank);

  return (
    <View 
      className="flex-row items-center py-3 border-b last:border-b-0"
      style={{ borderColor: theme.colors.border }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: rankColors.bg }}
      >
        <Ionicons 
          name={getRankIcon(rank) as any} 
          size={20} 
          color={rankColors.text} 
        />
      </View>
      <View className="flex-1">
        <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>
          {storeName}
        </Text>
        <Text style={{ color: theme.colors['text-secondary'], fontSize: 14 }}>
          {receiptCount} {receiptCount === 1 ? 'receipt' : 'receipts'}
        </Text>
      </View>
      <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
        ${totalSpent}
      </Text>
    </View>
  );
};

// Helper function to convert hex to rgb
const hexToRgb = (hex: string): string => {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
};