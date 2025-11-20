// mobile/components/receipts/ReceiptStats.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';

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
  return (
    <Card className="flex-1 bg-surface">
      <View className="flex-row items-center mb-2">
        <View className={`${iconBg} rounded-full p-2 mr-2`}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text className="text-text-secondary text-sm">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-text-primary mb-1">{value}</Text>
      {subtitle && <Text className="text-xs text-text-muted">{subtitle}</Text>}
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
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-warning/20 text-warning';
      case 2:
        return 'bg-text-muted/20 text-text-muted';
      case 3:
        return 'bg-accent-light/20 text-accent-light';
      default:
        return 'bg-primary/20 text-primary-light';
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

  return (
    <View className="flex-row items-center py-3 border-b border-border last:border-b-0">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${getRankColor(
          rank
        )}`}
      >
        <Ionicons name={getRankIcon(rank) as any} size={20} color="currentColor" />
      </View>
      <View className="flex-1">
        <Text className="text-text-primary font-semibold">{storeName}</Text>
        <Text className="text-sm text-text-secondary">
          {receiptCount} {receiptCount === 1 ? 'receipt' : 'receipts'}
        </Text>
      </View>
      <Text className="text-primary font-bold">${totalSpent}</Text>
    </View>
  );
};

// mobile/hooks/useReceiptStats.ts
import { useState, useEffect } from 'react';
import receiptService, { ReceiptStats } from '../../services/receiptService';

export const useReceiptStats = () => {
  const [stats, setStats] = useState<ReceiptStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await receiptService.getReceiptStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, isLoading, error, refetch: fetchStats };
};