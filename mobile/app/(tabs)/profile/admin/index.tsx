// mobile/app/(tabs)/profile/admin/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productService, { PendingApprovalsCount } from '../../../../services/productService';
import { Card } from '../../../../components/ui/Card';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext';

interface AdminCardProps {
  title: string;
  count: number;
  icon: string;
  color: string;
  onPress: () => void;
  description: string;
}

const AdminCard: React.FC<AdminCardProps> = ({
  title,
  count,
  icon,
  color,
  onPress,
  description,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                backgroundColor: `${color}20`,
                borderRadius: 12,
                padding: 12,
                marginRight: 12,
              }}
            >
              <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.colors['text-primary'],
                  marginBottom: 2,
                }}
              >
                {title}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                {description}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: count > 0 ? color : theme.colors['text-muted'],
              }}
            >
              {count}
            </Text>
            <Text style={{ fontSize: 10, color: theme.colors['text-muted'], marginTop: 2 }}>
              pending
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { isSuperuser } = useAuth();
  const [pendingCounts, setPendingCounts] = useState<PendingApprovalsCount>({
    pending_stores: 0,
    pending_categories: 0,
    pending_products: 0,
    pending_prices: 0,
    total_pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingCounts = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const counts = await productService.getPendingApprovalsCount();
      setPendingCounts(counts);
    } catch (err: any) {
      console.error('Error fetching pending counts:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPendingCounts();
    }, [])
  );

  const onRefresh = () => {
    fetchPendingCounts(true);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create_product':
        router.push('/(tabs)/profile/admin/products/create');
        break;
      case 'create_store':
        router.push('/(tabs)/profile/admin/stores/create');
        break;
      case 'create_category':
        router.push('/(tabs)/profile/admin/categories/create');
        break;
      case 'manage_users':
        router.push('/(tabs)/profile/admin/users');
        break;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => fetchPendingCounts()} />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={{ padding: 16, paddingBottom: 40 }}>

        {/* Welcome Header */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 24 }}>
          <View style={{ alignItems: 'center', padding: 16 }}>
            <View
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                borderRadius: 9999,
                padding: 20,
                marginBottom: 12,
              }}
            >
              <Ionicons name="shield-checkmark" size={40} color={theme.colors.primary} />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: theme.colors['text-primary'],
                marginBottom: 4,
              }}
            >
              Admin Dashboard
            </Text>
            <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center' }}>
              {isSuperuser 
                ? 'Manage users, products, categories, stores, and review pending approvals'
                : 'Manage products, categories, stores, and review pending approvals'
              }
            </Text>
          </View>
        </Card>

        {/* Pending Approvals Summary */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: theme.colors['text-primary'],
              }}
            >
              Pending Approvals
            </Text>
          </View>

          <AdminCard
            title="Products"
            count={pendingCounts.pending_products}
            icon="cube-outline"
            color="#FF8C00"
            onPress={() => router.push('/(tabs)/profile/admin/products')}
            description="Products waiting for approval"
          />

          <AdminCard
            title="Stores"
            count={pendingCounts.pending_stores}
            icon="business-outline"
            color="#3B82F6"
            onPress={() => router.push('/(tabs)/profile/admin/stores')}
            description="Stores waiting for approval"
          />

          <AdminCard
            title="Categories"
            count={pendingCounts.pending_categories}
            icon="folder-outline"
            color="#10B981"
            onPress={() => router.push('/(tabs)/profile/admin/categories')}
            description="Categories waiting for approval"
          />

          <AdminCard
            title="Prices"
            count={pendingCounts.pending_prices}
            icon="pricetag-outline"
            color="#8B5CF6"
            onPress={() => router.push('/(tabs)/profile/admin/prices')}
            description="Price entries waiting for approval"
          />
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.colors['text-primary'],
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>

          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => handleQuickAction('create_product')}
              style={{
                backgroundColor: theme.colors.surface,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                <Ionicons name="add" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>
                  Create Product
                </Text>
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 12 }}>
                  Add a new product to the database
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors['text-muted']} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickAction('create_store')}
              style={{
                backgroundColor: theme.colors.surface,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                <Ionicons name="business" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>
                  Create Store
                </Text>
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 12 }}>
                  Add a new store location
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors['text-muted']} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickAction('create_category')}
              style={{
                backgroundColor: theme.colors.surface,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                <Ionicons name="folder-open" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>
                  Create Category
                </Text>
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 12 }}>
                  Add a new product category
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors['text-muted']} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Management (Superuser Only) */}
        {isSuperuser && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: theme.colors['text-primary'],
                marginBottom: 16,
              }}
            >
              User Management
            </Text>

            <TouchableOpacity
              onPress={() => handleQuickAction('manage_users')}
              style={{
                backgroundColor: theme.colors.surface,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                <Ionicons name="people" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>
                  Manage Users
                </Text>
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 12 }}>
                  View, create, and manage user accounts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors['text-muted']} />
            </TouchableOpacity>
          </View>
        )}

        {/* System Overview */}
        <View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.colors['text-primary'],
              marginBottom: 16,
            }}
          >
            System Overview
          </Text>

          <Card style={{ backgroundColor: theme.colors.surface }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: theme.colors.primary,
                    marginBottom: 4,
                  }}
                >
                  {pendingCounts.total_pending}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                  Total Pending
                </Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#10B981',
                    marginBottom: 4,
                  }}
                >
                  {Object.values(pendingCounts).filter(count => count === 0).length}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                  Cleared Sections
                </Text>
              </View>
            </View>

            <View
              style={{
                height: 8,
                backgroundColor: theme.colors.background,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${(pendingCounts.total_pending / 20) * 100}%`,
                  height: '100%',
                  backgroundColor: theme.colors.primary,
                }}
              />
            </View>
            <Text style={{ fontSize: 11, color: theme.colors['text-muted'], marginTop: 8 }}>
              {pendingCounts.total_pending} items awaiting review
            </Text>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}