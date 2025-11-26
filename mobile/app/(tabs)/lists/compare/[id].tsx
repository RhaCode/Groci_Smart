// mobile/app/(tabs)/lists/compare/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import shoppingListService, { PriceComparison } from '../../../../services/shoppingListService';
import { Card } from '../../../../components/ui/Card';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../context/ThemeContext';

export default function PriceComparisonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

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
    if (index === 0) return {
      backgroundColor: `${theme.colors.success}20`,
      borderColor: theme.colors.success
    };
    if (index === total - 1) return {
      backgroundColor: `${theme.colors.error}20`,
      borderColor: theme.colors.error
    };
    return {
      backgroundColor: theme.colors['surface-light'],
      borderColor: theme.colors['border-light']
    };
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

  // Check if there are no items with prices or if the API returns a message
  if (comparison.message || !comparison.items || comparison.items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ 
            backgroundColor: `${theme.colors.warning}20`, 
            borderRadius: 9999, 
            padding: 24, 
            marginBottom: 16,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ionicons name="information-circle-outline" size={64} color={theme.colors.warning} />
          </View>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: theme.colors['text-primary'], 
            textAlign: 'center',
            marginBottom: 8
          }}>
            {comparison?.message || 'No Price Data Available'}
          </Text>
          <Text style={{ 
            color: theme.colors['text-secondary'], 
            textAlign: 'center' 
          }}>
            Link your list items to products to enable price comparison across stores
          </Text>
        </View>
      </View>
    );
  }

  // Sort stores by total price - check if store_totals exists
  const sortedStores = comparison.store_totals 
    ? Object.entries(comparison.store_totals)
        .map(([store, total]) => ({ store, total }))
        .sort((a, b) => a.total - b.total)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchComparison(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Summary Card */}
        <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-secondary'], marginBottom: 8 }}>Shopping at</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: `${theme.colors.success}20`, 
                borderRadius: 9999, 
                padding: 12, 
                marginRight: 12 
              }}>
                <Ionicons name="trophy" size={24} color={theme.colors.success} />
              </View>
              <View>
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: theme.colors['text-primary'] 
                }}>
                  {comparison.best_store || 'No data'}
                </Text>
                <Text style={{ 
                  color: theme.colors.success, 
                  fontWeight: '500' 
                }}>
                  Best Overall Price
                </Text>
              </View>
            </View>
          </View>

          {comparison.potential_savings && parseFloat(comparison.potential_savings as any) > 0 && (
            <View style={{ 
              backgroundColor: `${theme.colors.success}10`, 
              borderWidth: 1, 
              borderColor: `${theme.colors.success}30`, 
              borderRadius: 8, 
              padding: 16 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="cash-outline" size={24} color={theme.colors.success} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ 
                      color: theme.colors.success, 
                      fontWeight: '600' 
                    }}>
                      Potential Savings
                    </Text>
                    <Text style={{ 
                      color: theme.colors.success, 
                      fontSize: 14 
                    }}>
                      vs. most expensive store
                    </Text>
                  </View>
                </View>
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: theme.colors.success 
                }}>
                  {formatAmount(comparison.potential_savings)}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Store Comparison */}
        {sortedStores.length > 0 && (
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 16 
            }}>
              Store Totals
            </Text>

            {sortedStores.map((store, index) => {
              const rankColors = getStoreRankColor(index, sortedStores.length);
              return (
                <View
                  key={store.store}
                  style={{
                    borderWidth: 2,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                    backgroundColor: rankColors.backgroundColor,
                    borderColor: rankColors.borderColor,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          borderRadius: 9999,
                          padding: 8,
                          marginRight: 12,
                          backgroundColor: index === 0 ? `${theme.colors.success}30` : theme.colors['surface-light'],
                        }}
                      >
                        <Ionicons
                          name={getStoreRankIcon(index, sortedStores.length) as any}
                          size={20}
                          color={index === 0 ? theme.colors.success : theme.colors['text-muted']}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          color: theme.colors['text-primary'], 
                          fontWeight: '600', 
                          fontSize: 16 
                        }}>
                          {store.store}
                        </Text>
                        {index === 0 && (
                          <Text style={{ 
                            color: theme.colors.success, 
                            fontSize: 12, 
                            fontWeight: '500' 
                          }}>
                            Lowest Total
                          </Text>
                        )}
                        {index === sortedStores.length - 1 && sortedStores.length > 1 && (
                          <Text style={{ 
                            color: theme.colors.error, 
                            fontSize: 12, 
                            fontWeight: '500' 
                          }}>
                            Highest Total
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ 
                        fontSize: 20, 
                        fontWeight: 'bold', 
                        color: theme.colors['text-primary'] 
                      }}>
                        {formatAmount(store.total)}
                      </Text>
                      {index > 0 && (
                        <Text style={{ 
                          fontSize: 12, 
                          color: theme.colors.error 
                        }}>
                          +{formatAmount(store.total - sortedStores[0].total)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Item-by-Item Comparison */}
        {comparison.items && comparison.items.length > 0 && (
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 16 
            }}>
              Item Comparison
            </Text>

            {comparison.items.map((item, itemIndex) => (
              <View
                key={item.item_id}
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: itemIndex < comparison.items.length - 1 ? 1 : 0,
                  borderBottomColor: itemIndex < comparison.items.length - 1 ? theme.colors.border : 'transparent'
                }}
              >
                {/* Item Header */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: theme.colors['text-primary'], 
                    marginBottom: 4 
                  }}>
                    {item.product_name}
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: theme.colors['text-secondary'] 
                  }}>
                    Quantity: {item.quantity}
                  </Text>
                </View>

                {/* Store Prices */}
                {item.stores && item.stores.map((store, storeIndex) => {
                  const isBest = store.unit_price === item.best_price;
                  const isWorst = item.stores && item.stores.length > 1 &&
                    store.unit_price === Math.max(...item.stores.map((s) => s.unit_price));

                  return (
                    <View
                      key={store.store_id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: isBest
                          ? `${theme.colors.success}10`
                          : isWorst
                          ? `${theme.colors.error}10`
                          : theme.colors['surface-light'],
                        borderWidth: isBest || isWorst ? 1 : 0,
                        borderColor: isBest
                          ? `${theme.colors.success}30`
                          : isWorst
                          ? `${theme.colors.error}30`
                          : 'transparent',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {isBest && (
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={theme.colors.success}
                            style={{ marginRight: 8 }}
                          />
                        )}
                        <Text
                          style={{
                            fontWeight: '500',
                            color: isBest
                              ? theme.colors.success
                              : isWorst
                              ? theme.colors.error
                              : theme.colors['text-primary'],
                          }}
                        >
                          {store.store_name}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={{
                            fontWeight: 'bold',
                            color: isBest
                              ? theme.colors.success
                              : isWorst
                              ? theme.colors.error
                              : theme.colors['text-primary'],
                          }}
                        >
                          {formatAmount(store.total_price)}
                        </Text>
                        <Text style={{ 
                          fontSize: 12, 
                          color: theme.colors['text-secondary'] 
                        }}>
                          {formatAmount(store.unit_price)} each
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Best Store for this item */}
                {item.best_store && (
                  <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={14} color={theme.colors.success} />
                    <Text style={{ 
                      fontSize: 12, 
                      color: theme.colors['text-secondary'], 
                      marginLeft: 4 
                    }}>
                      Best at {item.best_store} - {formatAmount(item.best_price)} each
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Info Note */}
        <View style={{ 
          backgroundColor: `${theme.colors.primary}10`, 
          borderWidth: 1, 
          borderColor: `${theme.colors.primary}30`, 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 16 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={{ 
              flex: 1, 
              color: theme.colors.primary, 
              fontSize: 14, 
              marginLeft: 8 
            }}>
              Prices shown are based on the most recent data available. Actual prices
              may vary. Visit stores for current pricing.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}