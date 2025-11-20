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
import { useTheme } from '../../../context/ThemeContext';

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
  const { theme } = useTheme();

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengths: PasswordStrength[] = [
      { score: 0, label: 'Very Weak', color: theme.colors.error },
      { score: 1, label: 'Weak', color: theme.colors.warning },
      { score: 2, label: 'Fair', color: theme.colors.warning },
      { score: 3, label: 'Good', color: theme.colors.primary },
      { score: 4, label: 'Strong', color: theme.colors.success },
      { score: 5, label: 'Very Strong', color: theme.colors.success },
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
    <View style={{ marginBottom: 16 }}>
      <Text style={{ 
        fontSize: 14, 
        fontWeight: '500', 
        color: theme.colors['text-secondary'], 
        marginBottom: 8 
      }}>
        {label}
      </Text>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: theme.colors.border, 
        borderRadius: 8, 
        backgroundColor: theme.colors.background, 
        paddingHorizontal: 12 
      }}>
        <TextInput
          style={{ 
            flex: 1, 
            paddingVertical: 12, 
            color: theme.colors['text-primary'] 
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors['text-muted']}
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
          style={{ padding: 8 }}
        >
          <Ionicons
            name={showPasswords[field] ? 'eye' : 'eye-off'}
            size={20}
            color={theme.colors['text-muted']}
          />
        </TouchableOpacity>
      </View>
      {errors[field] && (
        <Text style={{ 
          fontSize: 12, 
          color: theme.colors.error, 
          marginTop: 4 
        }}>
          {errors[field]}
        </Text>
      )}
    </View>
  );

  const passwordStrength = calculatePasswordStrength(formData.new_password);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Security Info */}
        <Card style={{ 
          marginBottom: 16, 
          backgroundColor: `${theme.colors.primary}10`, 
          borderWidth: 1, 
          borderColor: `${theme.colors.primary}20` 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 16 }}>
            <Ionicons
              name="information-circle"
              size={24}
              color={theme.colors.primary}
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <Text style={{ 
              flex: 1, 
              fontSize: 14, 
              color: theme.colors['text-primary'], 
              lineHeight: 20 
            }}>
              Use a strong password with uppercase, lowercase, numbers, and
              symbols for better security.
            </Text>
          </View>
        </Card>

        {/* Form */}
        <Card style={{ backgroundColor: theme.colors.surface, padding: 16, marginBottom: 16 }}>
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
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '500', 
                  color: theme.colors['text-secondary'] 
                }}>
                  Password Strength:
                </Text>
                <Text
                  style={{ 
                    fontSize: 12, 
                    fontWeight: 'bold', 
                    marginLeft: 8,
                    color: passwordStrength.color 
                  }}
                >
                  {passwordStrength.label}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <View
                    key={index}
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 9999,
                      backgroundColor:
                        index < passwordStrength.score
                          ? passwordStrength.color
                          : theme.colors['surface-light'],
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
        <Card style={{ backgroundColor: theme.colors.surface, padding: 16, marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: theme.colors['text-primary'], 
            marginBottom: 12 
          }}>
            Password Requirements
          </Text>
          <View style={{ gap: 8 }}>
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
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={req.met ? theme.colors.success : theme.colors['text-muted']}
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: req.met
                      ? theme.colors['text-primary']
                      : theme.colors['text-secondary'],
                  }}
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

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}