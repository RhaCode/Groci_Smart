// mobile/app/(tabs)/profile/admin/users/create.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService, { CreateUserData } from '../../../../../services/authService';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../context/ThemeContext';

export default function CreateUserScreen() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    is_staff: false,
    is_superuser: false,
  });

  const handleInputChange = (field: keyof CreateUserData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.password2) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (formData.is_superuser && !formData.is_staff) {
      Alert.alert('Error', 'Superuser must also be staff');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await authService.createUser(formData);
      Alert.alert(
        'Success',
        'User created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
      Alert.alert('Error', err.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => setError(null)}
          />
        )}

        <Card style={{ backgroundColor: theme.colors.surface, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.colors['text-primary'],
              marginBottom: 16,
            }}
          >
            Create New User
          </Text>

          {/* Username */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Username *
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                color: theme.colors['text-primary'],
                fontSize: 16,
              }}
              placeholder="Enter username"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
            />
          </View>

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Email *
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                color: theme.colors['text-primary'],
                fontSize: 16,
              }}
              placeholder="Enter email address"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* First Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              First Name (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                color: theme.colors['text-primary'],
                fontSize: 16,
              }}
              placeholder="Enter first name"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
            />
          </View>

          {/* Last Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Last Name (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                color: theme.colors['text-primary'],
                fontSize: 16,
              }}
              placeholder="Enter last name"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
            />
          </View>

          {/* Password */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Password *
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                color: theme.colors['text-primary'],
                fontSize: 16,
              }}
              placeholder="Enter password"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
            />
            <Text style={{ color: theme.colors['text-muted'], fontSize: 12, marginTop: 4 }}>
              Must be at least 8 characters long
            </Text>
          </View>

          {/* Confirm Password */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 8, fontWeight: '500' }}>
              Confirm Password *
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 12,
                color: theme.colors['text-primary'],
                fontSize: 16,
              }}
              placeholder="Confirm password"
              placeholderTextColor={theme.colors['text-muted']}
              value={formData.password2}
              onChangeText={(value) => handleInputChange('password2', value)}
              secureTextEntry
            />
          </View>

          {/* Permissions */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors['text-primary'], marginBottom: 12, fontWeight: '500' }}>
              Permissions
            </Text>

            {/* Staff Toggle */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>
                  Staff Member
                </Text>
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 12 }}>
                  Can access admin interface and approve content
                </Text>
              </View>
              <Switch
                value={formData.is_staff}
                onValueChange={(value) => handleInputChange('is_staff', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={formData.is_staff ? theme.colors.primary : theme.colors['text-muted']}
              />
            </View>

            {/* Superuser Toggle */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors['text-primary'], fontWeight: '500' }}>
                  Superuser
                </Text>
                <Text style={{ color: theme.colors['text-secondary'], fontSize: 12 }}>
                  Full access to all features, including user management
                </Text>
              </View>
              <Switch
                value={formData.is_superuser}
                onValueChange={(value) => handleInputChange('is_superuser', value)}
                trackColor={{ false: theme.colors.border, true: '#8B5CF6' }}
                thumbColor={formData.is_superuser ? '#8B5CF6' : theme.colors['text-muted']}
                disabled={!formData.is_staff}
              />
            </View>

            {!formData.is_staff && formData.is_superuser && (
              <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 8 }}>
                Superuser must also be staff
              </Text>
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Create User"
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
            size="lg"
          />
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}