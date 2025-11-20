// mobile/app/+not-found.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      {/* Icon */}
      <View className="bg-error/10 rounded-full p-8 mb-6">
        <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
      </View>

      {/* Error Code */}
      <Text className="text-6xl font-bold text-text-primary mb-2">404</Text>

      {/* Title */}
      <Text className="text-2xl font-bold text-text-primary mb-3 text-center">
        Page Not Found
      </Text>

      {/* Description */}
      <Text className="text-text-secondary text-center mb-8 px-4">
        Oops! The page you're looking for doesn't exist or has been moved.
      </Text>

      {/* Action Buttons */}
      <View className="w-full max-w-sm">
        <Button
          title="Go to Home"
          onPress={() => router.replace('/(tabs)/home')}
          variant="primary"
          size="lg"
          fullWidth
        />

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 py-3 items-center"
        >
          <View className="flex-row items-center">
            <Ionicons name="arrow-back" size={20} color="#64748b" />
            <Text className="text-text-secondary font-medium ml-2">
              Go Back
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Helpful Links */}
      <View className="mt-12 items-center">
        <Text className="text-sm text-text-secondary mb-3">
          Quick Links:
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={() => router.push('/(tabs)/receipts')}>
            <Text className="text-primary font-medium">Receipts</Text>
          </TouchableOpacity>
          <Text className="text-text-secondary">•</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/lists')}>
            <Text className="text-primary font-medium">Lists</Text>
          </TouchableOpacity>
          <Text className="text-text-secondary">•</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Text className="text-primary font-medium">Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}