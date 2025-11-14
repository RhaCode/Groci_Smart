// mobile/components/ui/LoadingSpinner.tsx
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  fullScreen = false,
}) => {
  const Container = fullScreen ? View : React.Fragment;
  const containerProps = fullScreen
    ? { className: 'flex-1 justify-center items-center bg-white' }
    : {};

  return (
    <Container {...containerProps}>
      <View className="justify-center items-center p-4">
        <ActivityIndicator size={size} color="#0284c7" />
        {message && <Text className="text-gray-600 mt-2 text-center">{message}</Text>}
      </View>
    </Container>
  );
};