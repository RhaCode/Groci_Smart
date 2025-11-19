// mobile/components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

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
  className,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary border border-primary active:bg-primary-dark';
      case 'secondary':
        return 'bg-accent border border-accent active:bg-accent-dark';
      case 'outline':
        return 'bg-transparent border-2 border-border-light active:bg-surface-light';
      case 'danger':
        return 'bg-error border border-error active:bg-error/80';
      default:
        return 'bg-primary border border-primary active:bg-primary-dark';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4';
      case 'md':
        return 'py-3 px-6';
      case 'lg':
        return 'py-4 px-8';
      default:
        return 'py-3 px-6';
    }
  };

  const getTextClasses = () => {
    const baseClasses = 'font-semibold text-center';
    
    const colorClasses = {
      primary: 'text-text-primary',
      secondary: 'text-text-primary',
      outline: 'text-text-primary',
      danger: 'text-text-primary',
    }[variant];
    
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    }[size];

    return `${baseClasses} ${colorClasses} ${sizeClasses}`;
  };

  return (
    <TouchableOpacity
      className={`rounded-lg ${getVariantClasses()} ${getSizeClasses()} ${
        fullWidth ? 'w-full' : ''
      } ${disabled || loading ? 'opacity-50' : ''} ${className || ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#f9fafb" />
      ) : (
        <Text className={getTextClasses()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};