// mobile/components/ui/ErrorMessage.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <View className="flex-1 justify-center items-center p-4">
      <View className="bg-error-50 rounded-full p-4 mb-4">
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
      </View>
      <Text className="text-gray-800 text-lg font-semibold text-center mb-2">
        Oops! Something went wrong
      </Text>
      <Text className="text-gray-600 text-center mb-4">{message}</Text>
      {onRetry && (
        <Button title="Try Again" onPress={onRetry} size="sm" />
      )}
    </View>
  );
};