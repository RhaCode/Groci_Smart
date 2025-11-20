// mobile/app/(tabs)/profile/change-password.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../../services/authService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface FormData {
  old_password: string;
  new_password: string;
  new_password2: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function ChangePasswordScreen() {
  const [formData, setFormData] = useState<FormData>({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old_password: false,
    new_password: false,
    new_password2: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengths: PasswordStrength[] = [
      { score: 0, label: 'Very Weak', color: '#ef4444' },
      { score: 1, label: 'Weak', color: '#f97316' },
      { score: 2, label: 'Fair', color: '#eab308' },
      { score: 3, label: 'Good', color: '#3b82f6' },
      { score: 4, label: 'Strong', color: '#22c55e' },
      { score: 5, label: 'Very Strong', color: '#22c55e' },
    ];

    return strengths[score] || strengths[0];
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.old_password) {
      newErrors.old_password = 'Current password is required';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }

    if (!formData.new_password2) {
      newErrors.new_password2 = 'Please confirm your password';
    } else if (formData.new_password !== formData.new_password2) {
      newErrors.new_password2 = 'Passwords do not match';
    }

    if (formData.old_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
        new_password2: formData.new_password2,
      });

      Alert.alert(
        'Success',
        'Your password has been changed successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                old_password: '',
                new_password: '',
                new_password2: '',
              });
              setErrors({});
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordField = ({
    label,
    field,
    placeholder,
  }: {
    label: string;
    field: keyof FormData;
    placeholder: string;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-text-secondary mb-2">
        {label}
      </Text>
      <View className="flex-row items-center border border-border rounded-lg bg-background px-3">
        <TextInput
          className="flex-1 py-3 text-text-primary"
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          secureTextEntry={!showPasswords[field]}
          value={formData[field]}
          onChangeText={(value) => {
            setFormData({ ...formData, [field]: value });
            if (errors[field]) {
              setErrors({ ...errors, [field]: undefined });
            }
          }}
          editable={!isLoading}
        />
        <TouchableOpacity
          onPress={() =>
            setShowPasswords({
              ...showPasswords,
              [field]: !showPasswords[field],
            })
          }
          disabled={isLoading}
          className="p-2"
        >
          <Ionicons
            name={showPasswords[field] ? 'eye' : 'eye-off'}
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>
      </View>
      {errors[field] && (
        <Text className="text-xs text-error mt-1">{errors[field]}</Text>
      )}
    </View>
  );

  const passwordStrength = calculatePasswordStrength(formData.new_password);

  return (
    <ScrollView className="flex-1 p-4 bg-background">
      {/* Security Info */}
      <Card className="mb-4 bg-blue-500/10 border border-blue-500/20">
        <View className="flex-row items-start p-4">
          <Ionicons
            name="information-circle"
            size={24}
            color="#3b82f6"
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <Text className="flex-1 text-sm text-text-primary leading-5">
            Use a strong password with uppercase, lowercase, numbers, and
            symbols for better security.
          </Text>
        </View>
      </Card>

      {/* Form */}
      <Card className="bg-surface p-4 mb-4">
        {/* Current Password */}
        <PasswordField
          label="Current Password"
          field="old_password"
          placeholder="Enter current password"
        />

        {/* New Password */}
        <PasswordField
          label="New Password"
          field="new_password"
          placeholder="Enter new password"
        />

        {/* Password Strength Indicator */}
        {formData.new_password && (
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-xs font-medium text-text-secondary">
                Password Strength:
              </Text>
              <Text
                className="text-xs font-bold ml-2"
                style={{ color: passwordStrength.color }}
              >
                {passwordStrength.label}
              </Text>
            </View>
            <View className="flex-row gap-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <View
                  key={index}
                  className="flex-1 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      index < passwordStrength.score
                        ? passwordStrength.color
                        : '#e5e7eb',
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Confirm New Password */}
        <PasswordField
          label="Confirm New Password"
          field="new_password2"
          placeholder="Re-enter new password"
        />
      </Card>

      {/* Password Requirements */}
      <Card className="bg-surface p-4 mb-6">
        <Text className="text-sm font-medium text-text-primary mb-3">
          Password Requirements
        </Text>
        <View className="space-y-2">
          {[
            {
              met: formData.new_password.length >= 8,
              text: 'At least 8 characters',
            },
            {
              met: /[a-z]/.test(formData.new_password),
              text: 'Lowercase letters (a-z)',
            },
            {
              met: /[A-Z]/.test(formData.new_password),
              text: 'Uppercase letters (A-Z)',
            },
            {
              met: /[0-9]/.test(formData.new_password),
              text: 'Numbers (0-9)',
            },
            {
              met: /[^a-zA-Z0-9]/.test(formData.new_password),
              text: 'Special characters (!@#$%)',
            },
          ].map((req, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <Ionicons
                name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={req.met ? '#22c55e' : '#9ca3af'}
              />
              <Text
                className={`text-sm ${
                  req.met
                    ? 'text-text-primary'
                    : 'text-text-secondary'
                }`}
              >
                {req.text}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Submit Button */}
      <Button
        title={isLoading ? 'Changing Password...' : 'Change Password'}
        onPress={handleChangePassword}
        variant="primary"
        fullWidth
        disabled={isLoading}
      />

      <View className="h-6" />
    </ScrollView>
  );
}