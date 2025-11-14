// mobile/app/(tabs)/profile/change-password.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-xl font-bold text-gray-800">Change Password</Text>
        <Text className="text-gray-600 mt-2">Password change form coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}