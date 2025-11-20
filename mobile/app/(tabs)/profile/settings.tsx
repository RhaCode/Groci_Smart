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
  const { theme, themeMode, setThemeMode } = useTheme();
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
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Personal Information */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: theme.colors['text-primary'], 
          marginBottom: 12 
        }}>
          Personal Information
        </Text>
        <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface, padding: 16 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '500', 
              color: theme.colors['text-secondary'], 
              marginBottom: 8 
            }}>
              First Name
            </Text>
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: theme.colors.border, 
                borderRadius: 8, 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                color: theme.colors['text-primary'], 
                backgroundColor: theme.colors.background 
              }}
              placeholder="First Name"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.first_name}
              onChangeText={(value) =>
                setFormData({ ...formData, first_name: value })
              }
              editable={!isSaving}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '500', 
              color: theme.colors['text-secondary'], 
              marginBottom: 8 
            }}>
              Last Name
            </Text>
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: theme.colors.border, 
                borderRadius: 8, 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                color: theme.colors['text-primary'], 
                backgroundColor: theme.colors.background 
              }}
              placeholder="Last Name"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.last_name}
              onChangeText={(value) =>
                setFormData({ ...formData, last_name: value })
              }
              editable={!isSaving}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '500', 
              color: theme.colors['text-secondary'], 
              marginBottom: 8 
            }}>
              Phone Number
            </Text>
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: theme.colors.border, 
                borderRadius: 8, 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                color: theme.colors['text-primary'], 
                backgroundColor: theme.colors.background 
              }}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.phone_number}
              onChangeText={(value) =>
                setFormData({ ...formData, phone_number: value })
              }
              keyboardType="phone-pad"
              editable={!isSaving}
            />
          </View>

          <View>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '500', 
              color: theme.colors['text-secondary'], 
              marginBottom: 8 
            }}>
              Budget Limit ($)
            </Text>
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: theme.colors.border, 
                borderRadius: 8, 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                color: theme.colors['text-primary'], 
                backgroundColor: theme.colors.background 
              }}
              placeholder="0.00"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.budget_limit}
              onChangeText={handleBudgetChange}
              keyboardType="decimal-pad"
              editable={!isSaving}
            />
            <Text style={{ 
              fontSize: 12, 
              color: theme.colors['text-muted'], 
              marginTop: 4 
            }}>
              Optional: Set a monthly budget limit for shopping lists
            </Text>
          </View>
        </Card>

        {/* Theme Settings */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: theme.colors['text-primary'], 
          marginBottom: 12,
          marginTop: 16
        }}>
          Appearance
        </Text>
        <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: theme.colors['text-secondary'], 
            paddingHorizontal: 16, 
            paddingTop: 16, 
            marginBottom: 12 
          }}>
            Theme
          </Text>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
            {(['auto', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setThemeMode(mode)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  backgroundColor: themeMode === mode
                    ? `${theme.colors.accent}10`
                    : theme.colors.background,
                  borderColor: themeMode === mode
                    ? theme.colors.accent
                    : theme.colors.border,
                }}
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
                  color={themeMode === mode ? theme.colors.accent : theme.colors['text-muted']}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontWeight: '500',
                    fontSize: 16,
                    textTransform: 'capitalize',
                    color: themeMode === mode
                      ? theme.colors.accent
                      : theme.colors['text-primary'],
                  }}
                >
                  {mode === 'auto' ? 'Auto (System)' : mode}
                </Text>
                {themeMode === mode && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Notifications */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: theme.colors['text-primary'], 
          marginBottom: 12,
          marginTop: 8
        }}>
          Notifications
        </Text>
        <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}>
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
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderBottomWidth: index !== 2 ? 1 : 0,
                borderBottomColor: index !== 2 ? theme.colors.border : 'transparent'
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: theme.colors['text-primary'] 
                }}>
                  {item.title}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: theme.colors['text-secondary'], 
                  marginTop: 4 
                }}>
                  {item.description}
                </Text>
              </View>
              <Switch
                value={notifications[item.key as keyof typeof notifications]}
                onValueChange={(value) =>
                  setNotifications({
                    ...notifications,
                    [item.key]: value,
                  })
                }
                disabled={isSaving}
                trackColor={{ false: theme.colors['surface-light'], true: theme.colors.accent }}
                thumbColor={theme.colors.surface}
              />
            </View>
          ))}
        </Card>

        {/* Save Button */}
        <Button
          title={isSaving ? 'Saving...' : 'Save Changes'}
          onPress={handleSaveProfile}
          variant="primary"
          fullWidth
          disabled={isSaving}
        />

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}