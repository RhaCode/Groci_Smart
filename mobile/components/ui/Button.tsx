// mobile/components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      borderWidth: variant === 'outline' ? 2 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.accent,
          borderColor: theme.colors.accent,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: theme.colors['border-light'],
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.error,
          borderColor: theme.colors.error,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'md':
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    const colorStyles: TextStyle = {
      primary: { color: theme.colors['text-primary'] },
      secondary: { color: theme.colors['text-primary'] },
      outline: { color: theme.colors['text-primary'] },
      danger: { color: theme.colors['text-primary'] },
    }[variant];

    const sizeStyles: TextStyle = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    }[size];

    return { ...baseStyle, ...colorStyles, ...sizeStyles };
  };

  const buttonStyles: ViewStyle = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    width: fullWidth ? '100%' : undefined,
    opacity: disabled || loading ? 0.5 : 1,
  };

  return (
    <TouchableOpacity
      style={[buttonStyles, style]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors['text-primary']} />
      ) : (
        <Text style={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};