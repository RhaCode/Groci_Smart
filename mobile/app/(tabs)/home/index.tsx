// mobile/app/(tabs)/home/index.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { StatsCard, TopStoreCard } from '../../../components/receipts/ReceiptStats';
import { useReceiptStats } from '@/hooks/useReceipts';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark, theme } = useTheme();
  const { stats, isLoading, refetch } = useReceiptStats();

  // Refresh stats when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." fullScreen />;
  }

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
  };

  return (
    <ScrollView 
      className="flex-1 p-4"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Welcome Header */}
      <View className="mb-6">
        <Text 
          className="text-2xl font-bold mb-1"
          style={{ color: theme.colors['text-primary'] }}
        >
          Welcome back, {user?.first_name || user?.username}! 👋
        </Text>
        <Text style={{ color: theme.colors['text-secondary'] }}>
          Here's your grocery overview
        </Text>
      </View>

      {/* Quick Stats */}
      <View className="flex-row gap-3 mb-4">
        <StatsCard
          icon="receipt-outline"
          iconColor={theme.colors.primary}
          iconBg={isDark ? 'bg-primary/20' : 'bg-light-primary/20'}
          label="Total Receipts"
          value={stats?.total_receipts?.toString() || '0'}
        />
        <StatsCard
          icon="cash-outline"
          iconColor={theme.colors.success}
          iconBg={isDark ? 'bg-success/20' : 'bg-light-success/20'}
          label="Total Spent"
          value={`$${formatAmount(stats?.total_spent || 0)}`}
        />
      </View>

      {/* This Month Stats */}
      <View className="flex-row gap-3 mb-4">
        <StatsCard
          icon="calendar-outline"
          iconColor={theme.colors.accent}
          iconBg={isDark ? 'bg-accent/20' : 'bg-light-accent/20'}
          label="This Month"
          value={stats?.receipts_this_month?.toString() || '0'}
          subtitle="receipts"
        />
        <StatsCard
          icon="trending-up-outline"
          iconColor={theme.colors.warning}
          iconBg={isDark ? 'bg-warning/20' : 'bg-light-warning/20'}
          label="Month Spending"
          value={`$${formatAmount(stats?.spent_this_month || 0)}`}
        />
      </View>

      {/* Top Stores */}
      {stats && stats.top_stores && stats.top_stores.length > 0 && (
        <Card 
          className="mb-4"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: theme.colors['text-primary'] }}
          >
            Top Stores
          </Text>
          {stats.top_stores.map((store, index) => (
            <TopStoreCard
              key={store.store_name}
              storeName={store.store_name}
              receiptCount={store.receipt_count}
              totalSpent={store.total_spent}
              rank={index + 1}
            />
          ))}
        </Card>
      )}

      {/* Recent Receipts */}
      {stats && stats.recent_receipts && stats.recent_receipts.length > 0 && (
        <Card 
          className="mb-4"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text 
              className="text-lg font-semibold"
              style={{ color: theme.colors['text-primary'] }}
            >
              Recent Receipts
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/receipts')}>
              <Text 
                className="font-medium"
                style={{ color: theme.colors.primary }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>
          {stats.recent_receipts.map((receipt, index) => (
            <TouchableOpacity
              key={receipt.id}
              onPress={() => router.push(`/(tabs)/receipts/${receipt.id}`)}
              className={`flex-row justify-between items-center py-3 ${
                index !== stats.recent_receipts.length - 1 ? 'border-b' : ''
              }`}
              style={{
                borderColor: theme.colors.border,
              }}
            >
              <View className="flex-1">
                <Text 
                  className="font-medium"
                  style={{ color: theme.colors['text-primary'] }}
                >
                  {receipt.store_name}
                </Text>
                <Text 
                  className="text-sm"
                  style={{ color: theme.colors['text-secondary'] }}
                >
                  {new Date(receipt.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text 
                className="font-bold"
                style={{ color: theme.colors.primary }}
              >
                ${formatAmount(receipt.total_amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={{ backgroundColor: theme.colors.surface }}>
        <Text 
          className="text-lg font-semibold mb-3"
          style={{ color: theme.colors['text-primary'] }}
        >
          Quick Actions
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/receipts/upload')}
            className="flex-1 rounded-lg p-4 items-center"
            style={{
              backgroundColor: isDark 
                ? 'rgba(14, 165, 233, 0.1)' 
                : 'rgba(14, 165, 233, 0.15)',
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(14, 165, 233, 0.3)'
                : 'rgba(14, 165, 233, 0.4)',
            }}
          >
            <View 
              className="rounded-full p-3 mb-2"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Ionicons name="camera" size={24} color="#f9fafb" />
            </View>
            <Text 
              className="font-medium text-center"
              style={{ color: theme.colors['text-primary'] }}
            >
              Scan Receipt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/lists/create')}
            className="flex-1 rounded-lg p-4 items-center"
            style={{
              backgroundColor: isDark 
                ? 'rgba(217, 70, 239, 0.1)' 
                : 'rgba(217, 70, 239, 0.15)',
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(217, 70, 239, 0.3)'
                : 'rgba(217, 70, 239, 0.4)',
            }}
          >
            <View 
              className="rounded-full p-3 mb-2"
              style={{ backgroundColor: theme.colors.accent }}
            >
              <Ionicons name="list" size={24} color="#f9fafb" />
            </View>
            <Text 
              className="font-medium text-center"
              style={{ color: theme.colors['text-primary'] }}
            >
              New List
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}