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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
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
      clearError();
      await login({ username: username.trim(), password });
      // Navigation handled by root layout based on auth state
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    }
  };

  const navigateToRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
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
            <View className="bg-primary-100 rounded-full p-6 mb-4">
              <Text className="text-5xl">🛒</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back!
            </Text>
            <Text className="text-gray-600 text-center">
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
                setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              error={errors.username}
              icon="person-outline"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              icon="lock-closed-outline"
              secureTextEntry
            />

            {/* Forgot Password Link */}
            <TouchableOpacity className="self-end mb-6">
              <Text className="text-primary-600 font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          {/* Register Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text className="text-primary-600 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mt-4 bg-error-50 border border-error-200 rounded-lg p-3">
              <Text className="text-error-700 text-center">{error}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}