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
        <View className="bg-surface rounded-t-3xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-border">
            <Text className="text-xl font-bold text-text-primary">Filter Receipts</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* Status Filter */}
            <View className="mb-4">
              <Text className="text-text-primary font-semibold mb-2">Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFilter('status', option.value)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      filters.status === option.value
                        ? 'bg-primary border-primary'
                        : 'bg-surface-light border-border-light'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        filters.status === option.value
                          ? 'text-text-primary'
                          : 'text-text-secondary'
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
              <Text className="text-text-primary font-semibold mb-2">Date Range</Text>
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
              <Text className="text-xs text-text-muted mt-1">
                Format: YYYY-MM-DD
              </Text>
            </View>

            {/* Active Filters Count */}
            {Object.values(filters).filter(Boolean).length > 0 && (
              <View className="bg-primary/20 rounded-lg p-3 mb-4">
                <Text className="text-primary text-sm">
                  {Object.values(filters).filter(Boolean).length} filter(s) active
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="p-8 border-t border-border">
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
                variant="primary"
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};