// mobile/app/(tabs)/profile/admin/users/index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService, { User } from '../../../../../services/authService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';
import { useAuth } from '../../../../../context/AuthContext';

export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setError(null);
      } else {
        setIsLoading(true);
        setError(null);
      }

      const usersData = await authService.getUsers(searchQuery || undefined);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [searchQuery])
  );

  const onRefresh = () => {
    fetchUsers(true);
  };

  const handleUserPress = (userId: number) => {
    router.push({
      pathname: '/(tabs)/profile/admin/users/[id]',
      params: { id: userId },
    });
  };

  const handleDeleteUser = (user: User) => {
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
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers(true);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete user');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.colors['text-primary'],
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.username}
              </Text>
              {item.is_superuser && (
                <View
                  style={{
                    backgroundColor: '#8B5CF620',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#8B5CF6' }}>
                    Superuser
                  </Text>
                </View>
              )}
              {item.is_staff && !item.is_superuser && (
                <View
                  style={{
                    backgroundColor: '#3B82F620',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#3B82F6' }}>
                    Staff
                  </Text>
                </View>
              )}
            </View>

            {(item.first_name || item.last_name) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 }}>
                <Ionicons name="person-outline" size={12} color={theme.colors['text-muted']} />
                <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                  {item.first_name} {item.last_name}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 }}>
              <Ionicons name="mail-outline" size={12} color={theme.colors['text-muted']} />
              <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }} numberOfLines={1}>
                {item.email}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors['text-muted']} />
              <Text style={{ fontSize: 12, color: theme.colors['text-secondary'] }}>
                Joined {new Date(item.date_joined).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 12 }}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/profile/admin/users/edit/[id]',
                  params: { id: item.id },
                })
              }
              style={{
                backgroundColor: theme.colors.primary,
                padding: 8,
                borderRadius: 6,
              }}
            >
              <Ionicons name="pencil" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteUser(item)}
              disabled={item.id === currentUser?.id}
              style={{
                backgroundColor: item.id === currentUser?.id ? theme.colors['text-muted'] : '#EF4444',
                padding: 8,
                borderRadius: 6,
                opacity: item.id === currentUser?.id ? 0.5 : 1,
              }}
            >
              <Ionicons name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget Limit */}
        {item.profile?.budget_limit && (
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={{ fontSize: 11, color: theme.colors['text-muted'] }}>
              Budget: ${item.profile.budget_limit}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
        <View
          style={{
            backgroundColor: `${theme.colors.primary}20`,
            borderRadius: 9999,
            padding: 24,
            marginBottom: 16,
          }}
        >
          <Ionicons name="people-outline" size={64} color={theme.colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors['text-primary'],
            marginBottom: 8,
          }}
        >
          No Users Found
        </Text>
        <Text style={{ color: theme.colors['text-secondary'], textAlign: 'center' }}>
          {searchQuery ? 'Try adjusting your search' : 'Create new users to get started'}
        </Text>
      </View>
    );
  };

  if (isLoading && users.length === 0) {
    return <LoadingSpinner message="Loading users..." fullScreen />;
  }

  if (error && users.length === 0) {
    return <ErrorMessage message={error} onRetry={() => fetchUsers()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Search Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.background,
              borderRadius: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="search-outline" size={20} color={theme.colors['text-muted']} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                paddingVertical: 8,
                color: theme.colors['text-primary'],
              }}
              placeholder="Search users by username, email, or name..."
              placeholderTextColor={theme.colors['text-muted']}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserCard}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Create Button */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/profile/admin/users/create')}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}