// mobile/components/ui/Input.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  containerStyle,
  secureTextEntry,
  ...props
}) => {
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const isPassword = secureTextEntry;
  const { theme } = useTheme();

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label && (
        <Text style={{ 
          color: theme.colors.success, 
          fontWeight: '500', 
          marginBottom: 8 
        }}>
          {label}
        </Text>
      )}
      
      <View style={{ position: 'relative' }}>
        {icon && (
          <View style={{ 
            position: 'absolute', 
            left: 12, 
            top: 14, 
            zIndex: 10 
          }}>
            <Ionicons name={icon} size={20} color={theme.colors['text-muted']} />
          </View>
        )}
        
        <TextInput
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: theme.colors['text-primary'],
            paddingLeft: icon ? 44 : 16,
            paddingRight: isPassword ? 44 : 16,
          }}
          placeholderTextColor={theme.colors['text-muted']}
          secureTextEntry={isPassword && !isSecureVisible}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            style={{ position: 'absolute', right: 12, top: 14 }}
          >
            <Ionicons
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors['text-muted']}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={{ 
          color: theme.colors.success, 
          fontSize: 14, 
          marginTop: 4 
        }}>
          {error}
        </Text>
      )}
    </View>
  );
};