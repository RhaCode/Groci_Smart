// mobile/components/ui/LoadingSpinner.tsx
import React from 'react';
import { View, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();

  const containerStyle: ViewStyle = fullScreen ? {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  } : {};

  const contentStyle: ViewStyle = {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  };

  if (fullScreen) {
    return (
      <View style={containerStyle}>
        <View style={contentStyle}>
          <ActivityIndicator size={size} color={theme.colors.primary} />
          {message && (
            <Text style={{ 
              color: theme.colors['text-secondary'], 
              marginTop: 8, 
              textAlign: 'center' 
            }}>
              {message}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={contentStyle}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text style={{ 
          color: theme.colors['text-secondary'], 
          marginTop: 8, 
          textAlign: 'center' 
        }}>
          {message}
        </Text>
      )}
    </View>
  );
};