// mobile/app/(auth)/forgot-password.tsx
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
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement password reset API call
      // await authService.resetPassword(email.trim());
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setEmailSent(true);
    } catch (err: any) {
      Alert.alert(
        'Reset Failed',
        err.message || 'Failed to send reset email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleResetPassword();
  };

  if (emailSent) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView
          contentContainerClassName="flex-grow justify-center p-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Success Icon */}
          <View className="items-center mb-8">
            <View className="bg-success/20 rounded-full p-6 mb-4">
              <Ionicons name="mail-outline" size={64} color="#22c55e" />
            </View>
            <Text className="text-3xl font-bold text-text-primary mb-2 text-center">
              Check Your Email
            </Text>
            <Text className="text-text-secondary text-center px-4">
              We've sent password reset instructions to
            </Text>
            <Text className="text-primary font-semibold mt-2">
              {email}
            </Text>
          </View>

          {/* Instructions */}
          <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
            <Text className="text-text-primary font-semibold mb-2">
              What's next?
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-start mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#0ea5e9" />
                <Text className="text-text-secondary ml-2 flex-1">
                  Check your inbox for an email from us
                </Text>
              </View>
              <View className="flex-row items-start mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#0ea5e9" />
                <Text className="text-text-secondary ml-2 flex-1">
                  Click the reset link in the email
                </Text>
              </View>
              <View className="flex-row items-start">
                <Ionicons name="checkmark-circle" size={20} color="#0ea5e9" />
                <Text className="text-text-secondary ml-2 flex-1">
                  Create your new password
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <Button
            title="Back to Login"
            onPress={handleBackToLogin}
            variant="primary"
            size="lg"
            fullWidth
          />

          <TouchableOpacity
            onPress={handleResendEmail}
            className="mt-4 py-3 items-center"
          >
            <Text className="text-text-secondary">
              Didn't receive the email?{' '}
              <Text className="text-primary font-semibold">Resend</Text>
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <View className="mt-8 bg-warning/10 border border-warning/30 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text className="text-text-secondary text-sm ml-2 flex-1">
                If you don't see the email, check your spam folder or try again with a different email address.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

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
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBackToLogin}
            className="absolute top-12 left-6 z-10"
          >
            <View className="bg-surface rounded-full p-2 border border-border">
              <Ionicons name="arrow-back" size={24} color="#64748b" />
            </View>
          </TouchableOpacity>

          {/* Logo/Header Section */}
          <View className="items-center mb-8 mt-12">
            <View className="bg-primary/20 rounded-full p-6 mb-4">
              <Ionicons name="lock-closed-outline" size={64} color="#0ea5e9" />
            </View>
            <Text className="text-3xl font-bold text-text-primary mb-2">
              Forgot Password?
            </Text>
            <Text className="text-text-secondary text-center px-4">
              No worries! Enter your email and we'll send you reset instructions
            </Text>
          </View>

          {/* Form Section */}
          <View className="mb-6">
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              error={error}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            {/* Reset Button */}
            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={isLoading}
              fullWidth
              size="lg"
              variant="primary"
            />
          </View>

          {/* Back to Login */}
          <View className="flex-row justify-center items-center">
            <Text className="text-text-secondary">Remember your password? </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text className="text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View className="mt-8 bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row items-start">
              <Ionicons name="help-circle-outline" size={20} color="#64748b" />
              <View className="ml-2 flex-1">
                <Text className="text-text-primary font-semibold mb-1">
                  Need help?
                </Text>
                <Text className="text-text-secondary text-sm">
                  If you're having trouble resetting your password, contact our support team for assistance.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}