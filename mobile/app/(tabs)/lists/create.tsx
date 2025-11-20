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
import { router } from 'expo-router';
import shoppingListService from '../../../services/shoppingListService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useTheme } from '../../../context/ThemeContext';

export default function CreateListScreen() {
  const [listName, setListName] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { theme } = useTheme();

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: theme.colors.primary, 
              marginBottom: 8 
            }}>
              Create Shopping List
            </Text>
            <Text style={{ 
              color: theme.colors['text-secondary'] 
            }}>
              Give your list a name and start adding items
            </Text>
          </View>

          {/* Form */}
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
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
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 12 
            }}>
              Quick Templates
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                'Weekly Groceries',
                'Party Shopping',
                'Weekend BBQ',
                'Monthly Stock',
              ].map((template) => (
                <TouchableOpacity
                  key={template}
                  onPress={() => setListName(template)}
                  style={{ 
                    backgroundColor: `${theme.colors.accent}20`, 
                    paddingHorizontal: 16, 
                    paddingVertical: 8, 
                    borderRadius: 9999 
                  }}
                >
                  <Text style={{ 
                    color: theme.colors.accent, 
                    fontWeight: '500' 
                  }}>
                    {template}
                  </Text>
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
            style={{ paddingVertical: 12, alignItems: 'center', marginTop: 12 }}
            disabled={isCreating}
          >
            <Text style={{ 
              color: theme.colors['text-secondary'], 
              fontWeight: '500' 
            }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}