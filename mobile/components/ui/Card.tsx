// mobile/components/ui/Card.tsx
import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default',
  className,
  ...props 
}) => {
  const variantClasses = variant === 'elevated' 
    ? 'shadow-lg' 
    : 'shadow-sm';

  return (
    <View
      className={`bg-white rounded-xl p-4 ${variantClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </View>
  );
};