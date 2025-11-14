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
        return 'bg-primary-600 active:bg-primary-700';
      case 'secondary':
        return 'bg-secondary-600 active:bg-secondary-700';
      case 'outline':
        return 'bg-transparent border-2 border-primary-600 active:bg-primary-50';
      case 'danger':
        return 'bg-error-600 active:bg-error-700';
      default:
        return 'bg-primary-600 active:bg-primary-700';
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
    const colorClasses = variant === 'outline' ? 'text-primary-600' : 'text-white';
    
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
        <ActivityIndicator color={variant === 'outline' ? '#0284c7' : '#ffffff'} />
      ) : (
        <Text className={getTextClasses()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};


