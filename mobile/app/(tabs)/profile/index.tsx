// mobile/app/(tabs)/profile/index.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'settings-outline',
      title: 'Settings',
      onPress: () => router.push('/(tabs)/profile/settings'),
    },
    {
      icon: 'storefront-outline',
      title: 'Preferred Stores',
      onPress: () => router.push('/(tabs)/profile/stores'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Change Password',
      onPress: () => router.push('/(tabs)/profile/change-password'),
    },
    {
      icon: 'log-out-outline',
      title: 'Logout',
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Profile Header */}
        <Card style={{ alignItems: 'center', marginBottom: 16, backgroundColor: theme.colors.surface }}>
          <View style={{ 
            backgroundColor: `${theme.colors.primary}20`, 
            borderRadius: 9999, 
            padding: 24, 
            marginBottom: 16 
          }}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: theme.colors['text-primary'] 
          }}>
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.username}
          </Text>
          <Text style={{ 
            color: theme.colors['text-secondary'], 
            marginTop: 4 
          }}>
            {user?.email}
          </Text>
        </Card>

        {/* Menu Items */}
        <Card style={{ backgroundColor: theme.colors.surface }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              onPress={item.onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: index !== menuItems.length - 1 ? 1 : 0,
                borderBottomColor: index !== menuItems.length - 1 ? theme.colors.border : 'transparent'
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={item.danger ? theme.colors.error : theme.colors['text-muted']}
              />
              <Text
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: item.danger ? theme.colors.error : theme.colors['text-primary'],
                  fontWeight: '500',
                }}
              >
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors['text-muted']} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* App Version */}
        <Text style={{ 
          textAlign: 'center', 
          color: theme.colors['text-muted'], 
          marginTop: 24, 
          marginBottom: 16 
        }}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}