// mobile/components/lists/ListProgress.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <View className="bg-accent-light/10 border border-accent-light/30 rounded-lg p-4">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={20} color="#e879f9" />
          <Text className="text-text-primary font-semibold ml-2">
            Progress
          </Text>
        </View>
        <Text className="text-2xl font-bold text-accent">
          {percentage}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="h-3 bg-surface-light rounded-full overflow-hidden mb-2">
        <View
          className="h-full bg-accent rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>

      <Text className="text-sm text-text-secondary text-center">
        {checkedCount} of {itemsCount} items checked
      </Text>
    </View>
  );
};