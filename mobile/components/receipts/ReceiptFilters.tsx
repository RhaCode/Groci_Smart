// mobile/components/receipts/ReceiptFilters.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface FilterValues {
  status?: string;
  store?: string;
  startDate?: string;
  endDate?: string;
}

interface ReceiptFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export const ReceiptFilters: React.FC<ReceiptFiltersProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Completed', value: 'completed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
  ];

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  const updateFilter = (key: keyof FilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Filter Receipts</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* Status Filter */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFilter('status', option.value)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      filters.status === option.value
                        ? 'bg-primary-600 border-primary-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        filters.status === option.value
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Store Filter */}
            <Input
              label="Store Name"
              placeholder="Search by store name"
              value={filters.store || ''}
              onChangeText={(value) => updateFilter('store', value)}
              icon="storefront-outline"
            />

            {/* Date Range */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Date Range</Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input
                    placeholder="Start date"
                    value={filters.startDate || ''}
                    onChangeText={(value) => updateFilter('startDate', value)}
                    icon="calendar-outline"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    placeholder="End date"
                    value={filters.endDate || ''}
                    onChangeText={(value) => updateFilter('endDate', value)}
                    icon="calendar-outline"
                  />
                </View>
              </View>
              <Text className="text-xs text-gray-500 mt-1">
                Format: YYYY-MM-DD
              </Text>
            </View>

            {/* Active Filters Count */}
            {Object.values(filters).filter(Boolean).length > 0 && (
              <View className="bg-primary-50 rounded-lg p-3 mb-4">
                <Text className="text-primary-700 text-sm">
                  {Object.values(filters).filter(Boolean).length} filter(s) active
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="p-4 border-t border-gray-200">
            <View className="flex-row gap-2">
              <Button
                title="Reset"
                onPress={handleReset}
                variant="outline"
                className="flex-1"
              />
              <Button
                title="Apply Filters"
                onPress={handleApply}
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};