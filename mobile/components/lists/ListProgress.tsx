// mobile/components/lists/ListProgress.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface ListProgressProps {
  itemsCount: number;
  checkedCount: number;
  percentage: number;
}

export const ListProgress: React.FC<ListProgressProps> = ({
  itemsCount,
  checkedCount,
  percentage,
}) => {
  const { theme } = useTheme();

  return (
    <View style={{
      backgroundColor: `${theme.colors.accent}10`,
      borderWidth: 1,
      borderColor: `${theme.colors.accent}30`,
      borderRadius: 8,
      padding: 16,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.accent} />
          <Text style={{ color: theme.colors['text-primary'], fontWeight: '600', marginLeft: 8 }}>
            Progress
          </Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.accent }}>
          {percentage}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={{ 
        height: 12, 
        backgroundColor: theme.colors['surface-light'], 
        borderRadius: 9999, 
        overflow: 'hidden', 
        marginBottom: 8 
      }}>
        <View
          style={{ 
            height: '100%', 
            backgroundColor: theme.colors.accent, 
            borderRadius: 9999,
            width: `${percentage}%` 
          }}
        />
      </View>

      <Text style={{ 
        fontSize: 14, 
        color: theme.colors['text-secondary'], 
        textAlign: 'center' 
      }}>
        {checkedCount} of {itemsCount} items checked
      </Text>
    </View>
  );
};