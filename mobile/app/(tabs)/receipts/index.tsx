// mobile/app/(tabs)/receipts/index.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/ui/Button';

export default function ReceiptsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center p-6">
        <View className="bg-primary-100 rounded-full p-6 mb-4">
          <Ionicons name="receipt-outline" size={64} color="#0284c7" />
        </View>
        <Text className="text-xl font-bold text-gray-800 mb-2">
          No Receipts Yet
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Start by uploading your first receipt
        </Text>
        <Button
          title="Upload Receipt"
          onPress={() => router.push('/(tabs)/receipts/upload')}
        />
      </View>
    </SafeAreaView>
  );
}