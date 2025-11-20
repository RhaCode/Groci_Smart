// mobile/app/(tabs)/profile/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import authService from '../../../services/authService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { ThemeMode } from '../../../constants/theme';

export default function SettingsScreen() {
  const { user, refreshUser } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    budget_limit: '',
  });
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    price_alerts: true,
    list_reminders: true,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await authService.getProfile();
      
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: profile.profile?.phone_number || '',
        budget_limit: profile.profile?.budget_limit?.toString() || '',
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const budgetLimit = formData.budget_limit
        ? parseFloat(formData.budget_limit)
        : undefined;

      await authService.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        budget_limit: budgetLimit,
      });

      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBudgetChange = (value: string) => {
    // Allow only numbers and decimal point
    const filtered = value.replace(/[^0-9.]/g, '');
    setFormData({ ...formData, budget_limit: filtered });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#e879f9" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-background">
      {/* Personal Information */}
      <Text className="text-lg font-bold text-text-primary mb-3">
        Personal Information
      </Text>
      <Card className="mb-4 bg-surface p-4">
        <View className="mb-4">
          <Text className="text-sm font-medium text-text-secondary mb-2">
            First Name
          </Text>
          <TextInput
            className="border border-border rounded-lg px-3 py-2 text-text-primary bg-background"
            placeholder="First Name"
            value={formData.first_name}
            onChangeText={(value) =>
              setFormData({ ...formData, first_name: value })
            }
            editable={!isSaving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-text-secondary mb-2">
            Last Name
          </Text>
          <TextInput
            className="border border-border rounded-lg px-3 py-2 text-text-primary bg-background"
            placeholder="Last Name"
            value={formData.last_name}
            onChangeText={(value) =>
              setFormData({ ...formData, last_name: value })
            }
            editable={!isSaving}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-text-secondary mb-2">
            Phone Number
          </Text>
          <TextInput
            className="border border-border rounded-lg px-3 py-2 text-text-primary bg-background"
            placeholder="+1 (555) 000-0000"
            value={formData.phone_number}
            onChangeText={(value) =>
              setFormData({ ...formData, phone_number: value })
            }
            keyboardType="phone-pad"
            editable={!isSaving}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-text-secondary mb-2">
            Budget Limit ($)
          </Text>
          <TextInput
            className="border border-border rounded-lg px-3 py-2 text-text-primary bg-background"
            placeholder="0.00"
            value={formData.budget_limit}
            onChangeText={handleBudgetChange}
            keyboardType="decimal-pad"
            editable={!isSaving}
          />
          <Text className="text-xs text-text-muted mt-1">
            Optional: Set a monthly budget limit for shopping lists
          </Text>
        </View>
      </Card>

      {/* Theme Settings */}
      <Text className="text-lg font-bold text-text-primary mb-3 mt-4">
        Appearance
      </Text>
      <Card className="mb-4 bg-surface">
        <Text className="text-sm font-medium text-text-secondary px-4 pt-4 mb-3">
          Theme
        </Text>
        <View className="px-4 pb-4 gap-2">
          {(['auto', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setThemeMode(mode)}
              className={`flex-row items-center p-3 rounded-lg border ${
                themeMode === mode
                  ? 'bg-accent/10 border-accent'
                  : 'bg-background border-border'
              }`}
            >
              <Ionicons
                name={
                  mode === 'auto'
                    ? 'phone-portrait-outline'
                    : mode === 'light'
                    ? 'sunny-outline'
                    : 'moon-outline'
                }
                size={20}
                color={themeMode === mode ? '#e879f9' : '#9ca3af'}
                style={{ marginRight: 12 }}
              />
              <Text
                className={`flex-1 font-medium capitalize ${
                  themeMode === mode
                    ? 'text-accent'
                    : 'text-text-primary'
                }`}
              >
                {mode === 'auto' ? 'Auto (System)' : mode}
              </Text>
              {themeMode === mode && (
                <Ionicons name="checkmark" size={20} color="#e879f9" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Notifications */}
      <Text className="text-lg font-bold text-text-primary mb-3 mt-2">
        Notifications
      </Text>
      <Card className="mb-4 bg-surface">
        {[
          {
            key: 'email_notifications',
            title: 'Email Notifications',
            description: 'Receive email updates about your lists',
          },
          {
            key: 'price_alerts',
            title: 'Price Alerts',
            description: 'Get notified when prices drop',
          },
          {
            key: 'list_reminders',
            title: 'List Reminders',
            description: 'Reminders to complete your shopping lists',
          },
        ].map((item, index) => (
          <View
            key={item.key}
            className={`flex-row justify-between items-center py-4 px-4 ${
              index !== 2 ? 'border-b border-border' : ''
            }`}
          >
            <View className="flex-1">
              <Text className="text-base font-medium text-text-primary">
                {item.title}
              </Text>
              <Text className="text-xs text-text-secondary mt-1">
                {item.description}
              </Text>
            </View>
            <Switch
              value={
                notifications[item.key as keyof typeof notifications]
              }
              onValueChange={(value) =>
                setNotifications({
                  ...notifications,
                  [item.key]: value,
                })
              }
              disabled={isSaving}
            />
          </View>
        ))}
      </Card>

      {/* Theme Settings */}
      <Text className="text-lg font-bold text-text-primary mb-3 mt-4">
        Appearance
      </Text>
      <Card className="mb-4 bg-surface">
        <Text className="text-sm font-medium text-text-secondary px-4 pt-4 mb-3">
          Theme
        </Text>
        <View className="px-4 pb-4 gap-2">
          {(['auto', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setThemeMode(mode)}
              className={`flex-row items-center p-3 rounded-lg border ${
                themeMode === mode
                  ? 'bg-accent/10 border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Ionicons
                name={
                  mode === 'auto'
                    ? 'phone-portrait-outline'
                    : mode === 'light'
                    ? 'sunny-outline'
                    : 'moon-outline'
                }
                size={20}
                color={themeMode === mode ? '#e879f9' : '#9ca3af'}
                style={{ marginRight: 12 }}
              />
              <Text
                className={`flex-1 font-medium capitalize ${
                  themeMode === mode
                    ? 'text-accent'
                    : 'text-text-primary'
                }`}
              >
                {mode === 'auto' ? 'Auto (System)' : mode}
              </Text>
              {themeMode === mode && (
                <Ionicons name="checkmark" size={20} color="#e879f9" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Save Button */}
      <Button
        title={isSaving ? 'Saving...' : 'Save Changes'}
        onPress={handleSaveProfile}
        variant="primary"
        fullWidth
        disabled={isSaving}
      />

      <View className="h-6" />
    </ScrollView>
  );
}