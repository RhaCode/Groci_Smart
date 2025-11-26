// mobile/app/(auth)/login.tsx
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

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(username.trim(), password);
      // Navigation is handled by the root layout based on auth state
    } catch (err: any) {
      // Handle different types of errors from the auth service
      let errorMessage = 'Login failed. Please try again.';
      
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
          errorMessage = errorData.username[0];
        } else if (errorData.password) {
          errorMessage = errorData.password[0];
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const navigateToRegister = () => {
    router.push('/(auth)/register');
  };

  const navigateToForgotPassword = () => {
    // You can implement forgot password navigation here
    Alert.alert('Forgot Password', 'Please contact support to reset your password.');
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center p-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Header Section */}
          <View className="items-center mb-8">
            <View className="bg-primary/20 rounded-full p-6 mb-4">
              <Text className="text-5xl">🛒</Text>
            </View>
            <Text className="text-3xl font-bold text-text-primary mb-2">
              Welcome Back!
            </Text>
            <Text className="text-text-secondary text-center">
              Sign in to continue managing your groceries
            </Text>
          </View>

          {/* Form Section */}
          <View className="mb-6">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors.username) {
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              error={errors.username}
              icon="person-outline"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={errors.password}
              icon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity 
              className="self-end mb-6"
              onPress={navigateToForgotPassword}
              disabled={isLoading}
            >
              <Text className="text-primary font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              size="lg"
              variant="primary"
            />
          </View>

          {/* Register Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-text-secondary">Don't have an account? </Text>
            <TouchableOpacity 
              onPress={navigateToRegister}
              disabled={isLoading}
            >
              <Text className="text-primary font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}