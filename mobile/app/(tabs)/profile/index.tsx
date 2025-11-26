// mobile/app/(tabs)/profile/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, isStaff, isSuperuser, logout, isLoading, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." fullScreen />;
  }

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors['text-secondary'] }}>
          No user information available
        </Text>
      </View>
    );
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
      <View style={{ padding: 16 }}>
        {/* User Info Card */}
        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>
                {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: theme.colors['text-primary'],
                marginBottom: 4,
              }}
            >
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: theme.colors['text-secondary'],
                marginBottom: 12,
              }}
            >
              {user.email}
            </Text>

            {/* Role Badges */}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: theme.colors.primary,
                  }}
                >
                  User
                </Text>
              </View>

              {isStaff && (
                <View
                  style={{
                    backgroundColor: '#8B5CF620',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#8B5CF6',
                    }}
                  >
                    Staff
                  </Text>
                </View>
              )}

              {isSuperuser && (
                <View
                  style={{
                    backgroundColor: '#EF444420',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#EF4444',
                    }}
                  >
                    Admin
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          {/* Preferred Stores */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile/stores')}
            activeOpacity={0.7}
          >
            <Card style={{ backgroundColor: theme.colors.surface }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: `${theme.colors.primary}20`,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="storefront-outline"
                      size={22}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors['text-primary'],
                      }}
                    >
                      Preferred Stores
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme.colors['text-secondary'],
                      }}
                    >
                      Manage your favorite stores
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={theme.colors['text-muted']}
                />
              </View>
            </Card>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile/settings')}
            activeOpacity={0.7}
          >
            <Card style={{ backgroundColor: theme.colors.surface }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: '#10B98120',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={22}
                      color="#10B981"
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors['text-primary'],
                      }}
                    >
                      Settings
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme.colors['text-secondary'],
                      }}
                    >
                      App preferences and configuration
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={theme.colors['text-muted']}
                />
              </View>
            </Card>
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile/change-password')}
            activeOpacity={0.7}
          >
            <Card style={{ backgroundColor: theme.colors.surface }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: '#F59E0B20',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={22}
                      color="#F59E0B"
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors['text-primary'],
                      }}
                    >
                      Change Password
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme.colors['text-secondary'],
                      }}
                    >
                      Update your account security
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={theme.colors['text-muted']}
                />
              </View>
            </Card>
          </TouchableOpacity>

          {/* Admin Dashboard - Only for staff/admin */}
          {(isStaff || isSuperuser) && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile/admin')}
              activeOpacity={0.7}
            >
              <Card
                style={{
                  backgroundColor: theme.colors.surface,
                  borderLeftWidth: 4,
                  borderLeftColor: '#8B5CF6',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        backgroundColor: '#8B5CF620',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={22}
                        color="#8B5CF6"
                      />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: theme.colors['text-primary'],
                        }}
                      >
                        Admin Dashboard
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors['text-secondary'],
                        }}
                      >
                        Manage platform content
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={theme.colors['text-muted']}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#EF4444',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: 'white',
            }}
          >
            Logout
          </Text>
        </TouchableOpacity>

        {/* Bottom Spacer */}
        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}