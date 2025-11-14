
// mobile/components/ui/Input.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  containerClassName,
  secureTextEntry,
  ...props
}) => {
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View className={`mb-4 ${containerClassName || ''}`}>
      {label && <Text className="text-gray-700 font-medium mb-2">{label}</Text>}
      
      <View className="relative">
        {icon && (
          <View className="absolute left-3 top-4 z-10">
            <Ionicons name={icon} size={20} color="#6b7280" />
          </View>
        )}
        
        <TextInput
          className={`bg-white border border-gray-300 rounded-lg px-4 py-3 text-base ${
            icon ? 'pl-12' : ''
          } ${isPassword ? 'pr-12' : ''} ${error ? 'border-error-500' : 'focus:border-primary-500'}`}
          placeholderTextColor="#9ca3af"
          secureTextEntry={isPassword && !isSecureVisible}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            className="absolute right-3 top-4"
          >
            <Ionicons
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text className="text-error-600 text-sm mt-1">{error}</Text>}
    </View>
  );
};
