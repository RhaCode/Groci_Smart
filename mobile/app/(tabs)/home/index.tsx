// mobile/app/(tabs)/home/index.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.first_name || user?.username}! 👋
          </Text>
          <Text className="text-gray-600 mt-1">
            Here's your grocery overview
          </Text>
        </View>

        <Card className="mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Quick Stats
          </Text>
          <Text className="text-gray-600">
            Dashboard content coming soon...
          </Text>
        </Card>

        <Card>
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Recent Activity
          </Text>
          <Text className="text-gray-600">
            Your recent receipts and lists will appear here
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
