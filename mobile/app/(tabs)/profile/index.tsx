// mobile/app/(tabs)/profile/index.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        {/* Profile Header */}
        <Card className="items-center mb-4">
          <View className="bg-primary-100 rounded-full p-6 mb-4">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800">
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.username}
          </Text>
          <Text className="text-gray-600 mt-1">{user?.email}</Text>
        </Card>

        {/* Menu Items */}
        <Card>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              onPress={item.onPress}
              className={`flex-row items-center py-4 ${
                index !== menuItems.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={item.danger ? '#dc2626' : '#6b7280'}
              />
              <Text
                className={`flex-1 ml-3 text-base ${
                  item.danger ? 'text-error-600' : 'text-gray-800'
                } font-medium`}
              >
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </Card>

        {/* App Version */}
        <Text className="text-center text-gray-500 mt-6 mb-4">
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
