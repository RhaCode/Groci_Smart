// mobile/app/(tabs)/lists/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import shoppingListService, { ShoppingList } from '../../../../services/shoppingListService';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../components/ui/ErrorMessage';

export default function EditListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [listName, setListName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'archived'>('active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchList();
    }
  }, [id]);

  const fetchList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await shoppingListService.getShoppingListById(parseInt(id));
      setList(data);
      setListName(data.name);
      setNotes(data.notes);
      setStatus(data.status);
    } catch (err: any) {
      console.error('Error fetching list:', err);
      setError(err.message || 'Failed to load list');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!listName.trim()) {
      newErrors.listName = 'List name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      await shoppingListService.updateShoppingList(parseInt(id), {
        name: listName.trim(),
        notes: notes.trim(),
        status,
      });

      Alert.alert('Success', 'List updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update list');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: Array<{ label: string; value: 'active' | 'completed' | 'archived' }> = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Archived', value: 'archived' },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading list..." fullScreen />;
  }

  if (error || !list) {
    return <ErrorMessage message={error || 'List not found'} onRetry={fetchList} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4">
          {/* Form */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              List Information
            </Text>

            <Input
              label="List Name *"
              placeholder="Enter list name"
              value={listName}
              onChangeText={(value) => {
                setListName(value);
                setErrors((prev) => ({ ...prev, listName: '' }));
              }}
              error={errors.listName}
              icon="list-outline"
              maxLength={100}
            />

            <Input
              label="Notes"
              placeholder="Add any notes..."
              value={notes}
              onChangeText={setNotes}
              icon="document-text-outline"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </Card>

          {/* Status Selection */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Status
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setStatus(option.value)}
                  className={`px-4 py-3 rounded-lg border-2 ${
                    status === option.value
                      ? 'bg-secondary-600 border-secondary-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      status === option.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* List Stats */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              List Statistics
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Total Items</Text>
                <Text className="text-gray-800 font-semibold">{list.items_count}</Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Completed Items</Text>
                <Text className="text-gray-800 font-semibold">
                  {list.checked_items_count}
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Progress</Text>
                <Text className="text-gray-800 font-semibold">
                  {list.progress_percentage}%
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Estimated Total</Text>
                <Text className="text-gray-800 font-semibold">
                  ${parseFloat(list.estimated_total).toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Save Button */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            fullWidth
            size="lg"
            variant="secondary"
          />

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="py-3 items-center mt-3"
            disabled={isSaving}
          >
            <Text className="text-gray-600 font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}