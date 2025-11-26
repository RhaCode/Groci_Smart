// mobile/app/(tabs)/profile/admin/users/edit/[id].tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService, { User, UpdateUserData } from '../../../../../../services/authService';
import { Card } from '../../../../../../components/ui/Card';
import { Button } from '../../../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../../../../components/ui/ErrorMessage';
import { useTheme } from '../../../../../../context/ThemeContext';
import { useAuth } from '../../../../../../context/AuthContext';

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateUserData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_staff: false,
    is_superuser: false,
  });

  const fetchUser = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const userData = await authService.getUserById(parseInt(id));
      setUser(userData);

      // Populate form with existing data
      setFormData({
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        is_staff: userData.is_staff,
        is_superuser: userData.is_superuser,
      });
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to load user');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [id])
  );

  const onRefresh = () => {
    fetchUser(true);
  };

  const handleInputChange = (field: keyof UpdateUserData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (formData.username && !formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    if (formData.email && !formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
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

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.updateUser(parseInt(id), formData);
      Alert.alert(
        'Success',
        'User updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
      Alert.alert('Error', err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading user..." fullScreen />;
  }

  if (error || !user) {
    return <ErrorMessage message={error || 'User not found'} onRetry={() => fetchUser()} />;
  }

  const isCurrentUser = user.id === currentUser?.id;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
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
            Edit User
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
              First Name
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
              Last Name
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
                disabled={isCurrentUser}
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
                disabled={!formData.is_staff || isCurrentUser}
              />
            </View>

            {!formData.is_staff && formData.is_superuser && (
              <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 8 }}>
                Superuser must also be staff
              </Text>
            )}

            {isCurrentUser && (
              <Text style={{ color: theme.colors.warning, fontSize: 12, marginTop: 8 }}>
                You cannot modify your own permissions
              </Text>
            )}
          </View>

          {/* User Status */}
          <View style={{ 
            backgroundColor: theme.colors.background, 
            padding: 12, 
            borderRadius: 8,
            marginBottom: 16 
          }}>
            <Text style={{ color: theme.colors['text-primary'], fontWeight: '500', marginBottom: 8 }}>
              Current Status
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: user.is_superuser ? '#8B5CF620' : user.is_staff ? '#3B82F620' : '#10B98120',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  gap: 4,
                }}
              >
                <Ionicons
                  name={user.is_superuser ? 'shield-checkmark' : user.is_staff ? 'shield' : 'person'}
                  size={14}
                  color={user.is_superuser ? '#8B5CF6' : user.is_staff ? '#3B82F6' : '#10B981'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: user.is_superuser ? '#8B5CF6' : user.is_staff ? '#3B82F6' : '#10B981',
                  }}
                >
                  {user.is_superuser ? 'Superuser' : user.is_staff ? 'Staff' : 'Regular User'}
                </Text>
              </View>

              {isCurrentUser && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: `${theme.colors.primary}20`,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    gap: 4,
                  }}
                >
                  <Ionicons name="person-circle" size={14} color={theme.colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>
                    Current User
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Update User"
            onPress={handleSubmit}
            loading={isSubmitting}
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