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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import shoppingListService, { ShoppingList } from '../../../../services/shoppingListService';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../components/ui/ErrorMessage';
import { ListProgress } from '../../../../components/lists/ListProgress';
import { useTheme } from '../../../../context/ThemeContext';

export default function EditListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const fetchList = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
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
      setIsRefreshing(false);
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

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1, padding: 16 }}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={() => fetchList(true)}
              colors={[theme.colors.accent]}
              tintColor={theme.colors.accent}
            />
          }
        >
          {/* List Header - Similar to detail page */}
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: theme.colors['text-primary'], 
                  marginBottom: 8 
                }}>
                  List Information
                </Text>
                {list.notes && (
                  <Text style={{ color: theme.colors['text-secondary'], fontSize: 14 }}>
                    {list.notes}
                  </Text>
                )}
              </View>
            </View>

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
              maxLength={500}
            />

            <Input
              label="Notes"
              placeholder="Add any notes..."
              value={notes}
              onChangeText={setNotes}
              icon="document-text-outline"
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            {/* Estimated Total - Display similar to detail page */}
            {parseFloat(list.estimated_total) > 0 && (
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingTop: 16, 
                marginTop: 16,
                borderTopWidth: 1, 
                borderTopColor: theme.colors.border 
              }}>
                <Text style={{ color: theme.colors['text-secondary'], fontWeight: '500' }}>
                  Estimated Total
                </Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.accent }}>
                  {formatAmount(list.estimated_total)}
                </Text>
              </View>
            )}
          </Card>

          {/* Progress - Similar to detail page */}
          {list.items_count > 0 && (
            <View style={{ marginBottom: 16 }}>
              <ListProgress
                itemsCount={list.items_count}
                checkedCount={list.checked_items_count}
                percentage={list.progress_percentage}
              />
            </View>
          )}

          {/* Status Selection - Updated styling */}
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 16 
            }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setStatus(option.value)}
                  style={{
                    flex: 1,
                    minWidth: '30%',
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
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '600',
                      color: status === option.value ? theme.colors.surface : theme.colors['text-primary'],
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* List Stats - Updated styling */}
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: theme.colors['text-primary'], 
              marginBottom: 16 
            }}>
              List Statistics
            </Text>
            <View style={{ gap: 12 }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingVertical: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="list-outline" size={16} color={theme.colors['text-secondary']} />
                  <Text style={{ color: theme.colors['text-secondary'], fontWeight: '500' }}>
                    Total Items
                  </Text>
                </View>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600', fontSize: 16 }}>
                  {list.items_count}
                </Text>
              </View>

              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingVertical: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors['text-secondary']} />
                  <Text style={{ color: theme.colors['text-secondary'], fontWeight: '500' }}>
                    Completed Items
                  </Text>
                </View>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600', fontSize: 16 }}>
                  {list.checked_items_count}
                </Text>
              </View>

              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingVertical: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="trending-up-outline" size={16} color={theme.colors['text-secondary']} />
                  <Text style={{ color: theme.colors['text-secondary'], fontWeight: '500' }}>
                    Progress
                  </Text>
                </View>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '600', fontSize: 16 }}>
                  {list.progress_percentage}%
                </Text>
              </View>

              {parseFloat(list.estimated_total) > 0 && (
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingVertical: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="cash-outline" size={16} color={theme.colors['text-secondary']} />
                    <Text style={{ color: theme.colors['text-secondary'], fontWeight: '500' }}>
                      Estimated Total
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.accent, fontWeight: 'bold', fontSize: 16 }}>
                    {formatAmount(list.estimated_total)}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Action Buttons - Similar to detail page layout */}
          <View style={{ gap: 12, marginBottom: 16 }}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={isSaving}
              fullWidth
              size="lg"
              variant="primary"
            />

            <Button
              title="Cancel"
              onPress={() => router.back()}
              disabled={isSaving}
              fullWidth
              variant="outline"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}