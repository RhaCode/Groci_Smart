// mobile/app/(auth)/register.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password2) {
      newErrors.password2 = 'Please confirm your password';
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
      });
      // Navigation handled by root layout based on auth state
      // The user will be automatically redirected after successful registration
    } catch (err: any) {
      // Handle different types of errors from the auth service
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.data) {
        // API error with response data
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.username) {
          errorMessage = `Username: ${errorData.username[0]}`;
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password) {
          errorMessage = `Password: ${errorData.password[0]}`;
        } else {
          // Handle other field errors
          const firstErrorKey = Object.keys(errorData)[0];
          const firstError = errorData[firstErrorKey];
          if (Array.isArray(firstError)) {
            errorMessage = `${firstErrorKey}: ${firstError[0]}`;
          } else {
            errorMessage = firstError;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow p-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View className="items-center mb-6 mt-4">
            <View className="bg-primary/20 rounded-full p-6 mb-4">
              <Text className="text-5xl">🛒</Text>
            </View>
            <Text className="text-3xl font-bold text-text-primary mb-2">
              Create Account
            </Text>
            <Text className="text-text-secondary text-center">
              Join us to start managing your groceries smartly
            </Text>
          </View>

          {/* Form Section */}
          <View className="mb-6">
            <Input
              label="Username *"
              placeholder="Choose a username"
              value={formData.username}
              onChangeText={(text) => updateField('username', text)}
              error={errors.username}
              icon="person-outline"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Input
              label="Email *"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  label="First Name"
                  placeholder="First name"
                  value={formData.first_name}
                  onChangeText={(text) => updateField('first_name', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  value={formData.last_name}
                  onChangeText={(text) => updateField('last_name', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <Input
              label="Password *"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              error={errors.password}
              icon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
            />

            <Input
              label="Confirm Password *"
              placeholder="Re-enter your password"
              value={formData.password2}
              onChangeText={(text) => updateField('password2', text)}
              error={errors.password2}
              icon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
            />

            {/* Register Button */}
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              size="lg"
              variant="primary"
            />
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center items-center mb-4">
            <Text className="text-text-secondary">Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
              <Text className="text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Terms Text */}
          <Text className="text-text-muted text-xs text-center mt-4">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}