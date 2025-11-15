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
    <View className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={20} color="#c026d3" />
          <Text className="text-secondary-800 font-semibold ml-2">
            Progress
          </Text>
        </View>
        <Text className="text-2xl font-bold text-secondary-700">
          {percentage}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
        <View
          className="h-full bg-secondary-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>

      <Text className="text-sm text-gray-600 text-center">
        {checkedCount} of {itemsCount} items checked
      </Text>
    </View>
  );
};