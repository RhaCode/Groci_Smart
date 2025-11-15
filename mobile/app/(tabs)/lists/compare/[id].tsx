// mobile/app/(tabs)/lists/compare/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import shoppingListService, { PriceComparison } from '../../../../services/shoppingListService';
import { Card } from '../../../../components/ui/Card';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../components/ui/ErrorMessage';

export default function PriceComparisonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchComparison();
    }
  }, [id]);

  const fetchComparison = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await shoppingListService.compareListPrices(parseInt(id));
      setComparison(data);
    } catch (err: any) {
      console.error('Error fetching comparison:', err);
      setError(err.message || 'Failed to load price comparison');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const getStoreRankColor = (index: number, total: number) => {
    if (index === 0) return 'bg-success-100 border-success-500';
    if (index === total - 1) return 'bg-error-100 border-error-500';
    return 'bg-gray-100 border-gray-300';
  };

  const getStoreRankIcon = (index: number, total: number) => {
    if (index === 0) return 'trophy';
    if (index === total - 1) return 'trending-up';
    return 'storefront';
  };

  if (isLoading) {
    return <LoadingSpinner message="Comparing prices..." fullScreen />;
  }

  if (error || !comparison) {
    return (
      <ErrorMessage
        message={error || 'No price data available'}
        onRetry={() => fetchComparison()}
      />
    );
  }

  // Check if there are no items with prices
  if (comparison.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-warning-100 rounded-full p-6 mb-4">
            <Ionicons name="information-circle-outline" size={64} color="#f59e0b" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            No Price Data Available
          </Text>
          <Text className="text-gray-600 text-center">
            Link your list items to products to enable price comparison across stores
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Sort stores by total price
  const sortedStores = Object.entries(comparison.store_totals)
    .map(([store, total]) => ({ store, total }))
    .sort((a, b) => a.total - b.total);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchComparison(true)}
          />
        }
      >
        {/* Summary Card */}
        <Card className="mb-4">
          <View className="items-center mb-4">
            <Text className="text-gray-600 mb-2">Shopping at</Text>
            <View className="flex-row items-center">
              <View className="bg-success-100 rounded-full p-3 mr-3">
                <Ionicons name="trophy" size={24} color="#22c55e" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  {comparison.best_store}
                </Text>
                <Text className="text-success-600 font-medium">Best Overall Price</Text>
              </View>
            </View>
          </View>

          {parseFloat(comparison.potential_savings) > 0 && (
            <View className="bg-success-50 border border-success-200 rounded-lg p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="cash-outline" size={24} color="#22c55e" />
                  <View className="ml-3">
                    <Text className="text-success-900 font-semibold">
                      Potential Savings
                    </Text>
                    <Text className="text-success-700 text-sm">
                      vs. most expensive store
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-success-600">
                  {formatAmount(comparison.potential_savings)}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Store Comparison */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Store Totals
          </Text>

          {sortedStores.map((store, index) => (
            <View
              key={store.store}
              className={`border-2 rounded-lg p-4 mb-3 ${getStoreRankColor(
                index,
                sortedStores.length
              )}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`rounded-full p-2 mr-3 ${
                      index === 0 ? 'bg-success-200' : 'bg-gray-200'
                    }`}
                  >
                    <Ionicons
                      name={getStoreRankIcon(index, sortedStores.length) as any}
                      size={20}
                      color={index === 0 ? '#22c55e' : '#6b7280'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold text-base">
                      {store.store}
                    </Text>
                    {index === 0 && (
                      <Text className="text-success-600 text-xs font-medium">
                        Lowest Total
                      </Text>
                    )}
                    {index === sortedStores.length - 1 && sortedStores.length > 1 && (
                      <Text className="text-error-600 text-xs font-medium">
                        Highest Total
                      </Text>
                    )}
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold text-gray-800">
                    {formatAmount(store.total)}
                  </Text>
                  {index > 0 && (
                    <Text className="text-xs text-error-600">
                      +{formatAmount(store.total - sortedStores[0].total)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Item-by-Item Comparison */}
        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Item Comparison
          </Text>

          {comparison.items.map((item, itemIndex) => (
            <View
              key={item.item_id}
              className={`py-4 ${
                itemIndex < comparison.items.length - 1
                  ? 'border-b border-gray-200'
                  : ''
              }`}
            >
              {/* Item Header */}
              <View className="mb-3">
                <Text className="text-base font-semibold text-gray-800 mb-1">
                  {item.product_name}
                </Text>
                <Text className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </Text>
              </View>

              {/* Store Prices */}
              {item.stores.map((store, storeIndex) => {
                const isBest = store.unit_price === item.best_price;
                const isWorst =
                  store.unit_price ===
                  Math.max(...item.stores.map((s) => s.unit_price));

                return (
                  <View
                    key={store.store_id}
                    className={`flex-row justify-between items-center py-2 px-3 rounded-lg mb-2 ${
                      isBest
                        ? 'bg-success-50 border border-success-200'
                        : isWorst && item.stores.length > 1
                        ? 'bg-error-50 border border-error-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      {isBest && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#22c55e"
                          style={{ marginRight: 8 }}
                        />
                      )}
                      <Text
                        className={`font-medium ${
                          isBest
                            ? 'text-success-700'
                            : isWorst && item.stores.length > 1
                            ? 'text-error-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {store.store_name}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text
                        className={`font-bold ${
                          isBest
                            ? 'text-success-700'
                            : isWorst && item.stores.length > 1
                            ? 'text-error-700'
                            : 'text-gray-800'
                        }`}
                      >
                        {formatAmount(store.total_price)}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {formatAmount(store.unit_price)} each
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Best Store for this item */}
              <View className="mt-2 flex-row items-center">
                <Ionicons name="star" size={14} color="#22c55e" />
                <Text className="text-xs text-gray-600 ml-1">
                  Best at {item.best_store} - {formatAmount(item.best_price)} each
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Info Note */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#0284c7" />
            <Text className="flex-1 text-blue-800 text-sm ml-2">
              Prices shown are based on the most recent data available. Actual prices
              may vary. Visit stores for current pricing.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}