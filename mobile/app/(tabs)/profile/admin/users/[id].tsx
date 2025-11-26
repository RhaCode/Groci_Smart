// mobile/app/(tabs)/profile/admin/users/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService, { User } from '../../../../../services/authService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';
import { useAuth } from '../../../../../context/AuthContext';

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await authService.getUserById(parseInt(id));
      setUser(data);
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to load user');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [id])
  );

  const onRefresh = () => {
    fetchUser(true);
  };

  const handleDeleteUser = () => {
    if (!user) return;

    if (user.id === currentUser?.id) {
      Alert.alert('Error', 'You cannot delete your own account');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await authService.deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete user');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading user..." fullScreen />;
  }

  if (error || !user) {
    return <ErrorMessage message={error || 'User not found'} onRetry={() => fetchUser()} />;
  }

  const isCurrentUser = user.id === currentUser?.id;

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
        {/* Header Card */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: theme.colors['text-primary'],
                  marginBottom: 4,
                }}
              >
                {user.username}
              </Text>
              {(user.first_name || user.last_name) && (
                <Text
                  style={{
                    fontSize: 16,
                    color: theme.colors['text-secondary'],
                    marginBottom: 8,
                  }}
                >
                  {user.first_name} {user.last_name}
                </Text>
              )}
            </View>
          </View>

          {/* Status Badges */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {user.is_superuser && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#8B5CF620',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons name="shield-checkmark" size={14} color="#8B5CF6" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#8B5CF6' }}>
                  Superuser
                </Text>
              </View>
            )}

            {user.is_staff && !user.is_superuser && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#3B82F620',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons name="shield" size={14} color="#3B82F6" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6' }}>
                  Staff
                </Text>
              </View>
            )}

            {!user.is_staff && !user.is_superuser && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#10B98120',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons name="person" size={14} color="#10B981" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>
                  Regular User
                </Text>
              </View>
            )}

            {isCurrentUser && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: `${theme.colors.primary}20`,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons name="person-circle" size={14} color={theme.colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>
                  Current User
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* User Details */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors['text-primary'],
              marginBottom: 12,
            }}
          >
            Account Information
          </Text>

          <View style={{ gap: 12 }}>
            <DetailRow label="Username" value={user.username} />
            <DetailRow label="Email" value={user.email} />
            {user.first_name && <DetailRow label="First Name" value={user.first_name} />}
            {user.last_name && <DetailRow label="Last Name" value={user.last_name} />}
            <DetailRow
              label="Date Joined"
              value={new Date(user.date_joined).toLocaleDateString()}
            />
          </View>
        </Card>

        {/* Profile Information */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors['text-primary'],
              marginBottom: 12,
            }}
          >
            Profile Information
          </Text>

          <View style={{ gap: 12 }}>
            {user.profile?.phone_number && (
              <DetailRow label="Phone Number" value={user.profile.phone_number} />
            )}
            {user.profile?.budget_limit && (
              <DetailRow 
                label="Budget Limit" 
                value={`$${user.profile.budget_limit}`} 
              />
            )}
            <DetailRow 
              label="Preferred Stores" 
              value={user.profile?.preferred_stores?.length?.toString() || '0'} 
            />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/profile/admin/users/edit/[id]',
                params: { id: user.id },
              })
            }
          >
            <Button
              title="Edit User"
              onPress={() => {}}
              variant="secondary"
              fullWidth
              size="lg"
            />
          </TouchableOpacity>

          {!isCurrentUser && (
            <Button
              title="Delete User"
              onPress={handleDeleteUser}
              variant="danger"
              fullWidth
              size="lg"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// Detail Row Component
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors['text-secondary'], flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors['text-primary'],
          fontWeight: '500',
          flex: 1,
          textAlign: 'right',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
};