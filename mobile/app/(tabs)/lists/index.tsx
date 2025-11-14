// mobile/app/(tabs)/lists/index.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/ui/Button';

export default function ListsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center p-6">
        <View className="bg-secondary-100 rounded-full p-6 mb-4">
          <Ionicons name="list-outline" size={64} color="#c026d3" />
        </View>
        <Text className="text-xl font-bold text-gray-800 mb-2">
          No Shopping Lists
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Create your first shopping list
        </Text>
        <Button
          title="Create List"
          onPress={() => router.push('/(tabs)/lists/create')}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}