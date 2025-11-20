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
import { useTheme } from '../../../../context/ThemeContext';

export default function EditListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Form */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 12 
            }}>
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
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 12 
            }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setStatus(option.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 8,
                    borderWidth: 2,
                    backgroundColor: status === option.value
                      ? theme.colors.accent
                      : theme.colors.surface,
                    borderColor: status === option.value
                      ? theme.colors.accent
                      : theme.colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '500',
                      color: status === option.value ? theme.colors['text-primary'] : theme.colors['text-primary'],
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* List Stats */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 12 
            }}>
              List Statistics
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <Text style={{ color: theme.colors['text-secondary'] }}>Total Items</Text>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>{list.items_count}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <Text style={{ color: theme.colors['text-secondary'] }}>Completed Items</Text>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>
                  {list.checked_items_count}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <Text style={{ color: theme.colors['text-secondary'] }}>Progress</Text>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>
                  {list.progress_percentage}%
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <Text style={{ color: theme.colors['text-secondary'] }}>Estimated Total</Text>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600' }}>
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
            style={{ paddingVertical: 12, alignItems: 'center', marginTop: 12 }}
            disabled={isSaving}
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
  );
}