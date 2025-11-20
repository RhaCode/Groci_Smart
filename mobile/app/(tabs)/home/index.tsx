// mobile/app/(tabs)/home/index.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { StatsCard, TopStoreCard } from '../../../components/receipts/ReceiptStats';
import { useReceiptStats } from '@/components/receipts/ReceiptStats';

export default function HomeScreen() {
  const { user } = useAuth();
  const { stats, isLoading } = useReceiptStats();

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." fullScreen />;
  }

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
  };

  return (
      <ScrollView className="flex-1 p-4 bg-background">
        {/* Welcome Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-text-primary">
            Welcome back, {user?.first_name || user?.username}! 👋
          </Text>
          <Text className="text-text-secondary mt-1">
            Here's your grocery overview
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-3 mb-4">
          <StatsCard
            icon="receipt-outline"
            iconColor="#0ea5e9"
            iconBg="bg-primary/20"
            label="Total Receipts"
            value={stats?.total_receipts.toString() || '0'}
          />
          <StatsCard
            icon="cash-outline"
            iconColor="#22c55e"
            iconBg="bg-success/20"
            label="Total Spent"
            value={`${formatAmount(stats?.total_spent || 0)}`}
          />
        </View>

        {/* This Month Stats */}
        <View className="flex-row gap-3 mb-4">
          <StatsCard
            icon="calendar-outline"
            iconColor="#d946ef"
            iconBg="bg-accent/20"
            label="This Month"
            value={stats?.receipts_this_month.toString() || '0'}
            subtitle="receipts"
          />
          <StatsCard
            icon="trending-up-outline"
            iconColor="#f59e0b"
            iconBg="bg-warning/20"
            label="Month Spending"
            value={`${formatAmount(stats?.spent_this_month || 0)}`}
          />
        </View>

        {/* Top Stores */}
        {stats && stats.top_stores.length > 0 && (
          <Card className="mb-4 bg-surface">
            <Text className="text-lg font-semibold text-text-primary mb-3">
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
        {stats && stats.recent_receipts.length > 0 && (
          <Card className="mb-4 bg-surface">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-text-primary">
                Recent Receipts
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/receipts')}>
                <Text className="text-primary font-medium">View All</Text>
              </TouchableOpacity>
            </View>
            {stats.recent_receipts.map((receipt) => (
              <TouchableOpacity
                key={receipt.id}
                onPress={() => router.push(`/(tabs)/receipts/${receipt.id}`)}
                className="flex-row justify-between items-center py-3 border-b border-border"
              >
                <View className="flex-1">
                  <Text className="text-text-primary font-medium">
                    {receipt.store_name}
                  </Text>
                  <Text className="text-sm text-text-secondary">
                    {new Date(receipt.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text className="text-primary font-bold">
                  ${formatAmount(receipt.total_amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-surface">
          <Text className="text-lg font-semibold text-text-primary mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/receipts/upload')}
              className="flex-1 bg-primary/10 border border-primary/30 rounded-lg p-4 items-center"
            >
              <View className="bg-primary rounded-full p-3 mb-2">
                <Ionicons name="camera" size={24} color="#f9fafb" />
              </View>
              <Text className="text-text-primary font-medium text-center">
                Scan Receipt
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/lists/create')}
              className="flex-1 bg-accent/10 border border-accent/30 rounded-lg p-4 items-center"
            >
              <View className="bg-accent rounded-full p-3 mb-2">
                <Ionicons name="list" size={24} color="#f9fafb" />
              </View>
              <Text className="text-text-primary font-medium text-center">
                New List
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
  );
}