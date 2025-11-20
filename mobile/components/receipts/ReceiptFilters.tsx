// mobile/components/receipts/ReceiptFilters.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();

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
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
        <View style={{ 
          backgroundColor: theme.colors.surface, 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24, 
          maxHeight: '80%' 
        }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: 16, 
            borderBottomWidth: 1, 
            borderBottomColor: theme.colors.border 
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors['text-primary'] }}>
              Filter Receipts
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={theme.colors['text-muted']} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            {/* Status Filter */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: theme.colors['text-primary'], fontWeight: '600', marginBottom: 8 }}>
                Status
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFilter('status', option.value)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 9999,
                      borderWidth: 2,
                      backgroundColor: filters.status === option.value 
                        ? theme.colors.primary 
                        : theme.colors['surface-light'],
                      borderColor: filters.status === option.value 
                        ? theme.colors.primary 
                        : theme.colors['border-light'],
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: '500',
                        color: filters.status === option.value
                          ? theme.colors['text-primary']
                          : theme.colors['text-secondary'],
                      }}
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
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: theme.colors['text-primary'], fontWeight: '600', marginBottom: 8 }}>
                Date Range
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="Start date"
                    value={filters.startDate || ''}
                    onChangeText={(value) => updateFilter('startDate', value)}
                    icon="calendar-outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="End date"
                    value={filters.endDate || ''}
                    onChangeText={(value) => updateFilter('endDate', value)}
                    icon="calendar-outline"
                  />
                </View>
              </View>
              <Text style={{ fontSize: 12, color: theme.colors['text-muted'], marginTop: 4 }}>
                Format: YYYY-MM-DD
              </Text>
            </View>

            {/* Active Filters Count */}
            {Object.values(filters).filter(Boolean).length > 0 && (
              <View style={{ 
                backgroundColor: `${theme.colors.primary}20`, 
                borderRadius: 8, 
                padding: 12, 
                marginBottom: 16 
              }}>
                <Text style={{ color: theme.colors.primary, fontSize: 14 }}>
                  {Object.values(filters).filter(Boolean).length} filter(s) active
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={{ padding: 32, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                title="Reset"
                onPress={handleReset}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Apply Filters"
                onPress={handleApply}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};