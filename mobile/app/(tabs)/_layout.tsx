// mobile/app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9', // primary
        tabBarInactiveTintColor: '#9ca3af', // muted
        tabBarStyle: {
          backgroundColor: '#1f2937', // surface
          borderTopWidth: 1,
          borderTopColor: '#374151', // border
          paddingBottom: 5,
          paddingTop: 5,
          height: 80,
          position: 'relative',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Products Tab (Left of FAB) */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Receipts as Floating Action Button (Center) */}
      <Tabs.Screen
        name="receipts"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#0ea5e9', // primary
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: -15,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 8,
              }}
            >
              <Ionicons name="camera" size={28} color="#ffffff" />
            </View>
          ),
          tabBarLabel: '',
        }}
      />

      {/* Shopping Lists Tab (Right of FAB) */}
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}