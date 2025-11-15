// mobile/app/(tabs)/lists/create.tsx
import React, { useState } from 'react';
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
import { router } from 'expo-router';
import shoppingListService from '../../../services/shoppingListService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function CreateListScreen() {
  const [listName, setListName] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!listName.trim()) {
      newErrors.listName = 'List name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);

      const newList = await shoppingListService.createShoppingList({
        name: listName.trim(),
        notes: notes.trim(),
        status: 'active',
      });

      Alert.alert(
        'Success',
        'Shopping list created!',
        [
          {
            text: 'Add Items',
            onPress: () => {
              router.replace(`/(tabs)/lists/${newList.id}`);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create list');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              Create Shopping List
            </Text>
            <Text className="text-gray-600">
              Give your list a name and start adding items
            </Text>
          </View>

          {/* Form */}
          <Card className="mb-4">
            <Input
              label="List Name *"
              placeholder="e.g., Weekly Groceries, Party Supplies"
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
              label="Notes (Optional)"
              placeholder="Add any notes or reminders..."
              value={notes}
              onChangeText={setNotes}
              icon="document-text-outline"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </Card>

          {/* Quick Templates */}
          <Card className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Quick Templates
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                'Weekly Groceries',
                'Party Shopping',
                'Weekend BBQ',
                'Monthly Stock',
              ].map((template) => (
                <TouchableOpacity
                  key={template}
                  onPress={() => setListName(template)}
                  className="bg-secondary-100 px-4 py-2 rounded-full"
                >
                  <Text className="text-secondary-700 font-medium">{template}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Create Button */}
          <Button
            title="Create List"
            onPress={handleCreate}
            loading={isCreating}
            fullWidth
            size="lg"
            variant="secondary"
          />

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="py-3 items-center mt-3"
            disabled={isCreating}
          >
            <Text className="text-gray-600 font-medium">Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}