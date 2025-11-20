// mobile/components/ui/ErrorMessage.tsx
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useTheme } from '../../context/ThemeContext';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const { theme } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  };

  const iconContainerStyle: ViewStyle = {
    backgroundColor: `${theme.colors.error}20`,
    borderRadius: 9999,
    padding: 16,
    marginBottom: 16,
  };

  return (
    <View style={containerStyle}>
      <View style={iconContainerStyle}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
      </View>
      <Text style={{ 
        color: theme.colors['text-primary'], 
        fontSize: 18, 
        fontWeight: '600', 
        textAlign: 'center', 
        marginBottom: 8 
      }}>
        Oops! Something went wrong
      </Text>
      <Text style={{ 
        color: theme.colors['text-secondary'], 
        textAlign: 'center', 
        marginBottom: 16 
      }}>
        {message}
      </Text>
      {onRetry && (
        <Button title="Try Again" onPress={onRetry} size="sm" />
      )}
    </View>
  );
};