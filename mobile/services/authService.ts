// mobile/services/authService.ts
import api, { handleApiError, ApiError } from './api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
}

export interface UserProfile {
  phone_number?: string;
  budget_limit?: number;
  preferred_stores: PreferredStore[];
}

export interface PreferredStore {
  id: number;
  store_id: number;
  store_name: string;
  store_location: string;
  added_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password2: string;
}

class AuthService {
  // Store token securely
  private async storeToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web
        localStorage.setItem('authToken', token);
      } else {
        await SecureStore.setItemAsync('authToken', token);
      }
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  // Get stored token
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('authToken');
      } else {
        return await SecureStore.getItemAsync('authToken');
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  // Remove token
  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('authToken');
      } else {
        await SecureStore.deleteItemAsync('authToken');
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  // Login
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await api.post<AuthResponse>('/auth/login/', credentials);
      const { token, user } = response.data;
      
      // Store token
      await this.storeToken(token);
      
      return user;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Register
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await api.post<AuthResponse>('/auth/register/', data);
      const { token, user } = response.data;
      
      // Store token
      await this.storeToken(token);
      
      return user;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove token locally
      await this.removeToken();
    }
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<User>('/auth/profile/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update user profile
  async updateProfile(data: Partial<User & UserProfile>): Promise<User> {
    try {
      const response = await api.put<User>('/auth/profile/update/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Change password
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/change-password/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get preferred stores
  async getPreferredStores(): Promise<PreferredStore[]> {
    try {
      const response = await api.get<PreferredStore[]>('/auth/preferred-stores/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Add preferred store
  async addPreferredStore(storeId: number): Promise<PreferredStore> {
    try {
      const response = await api.post<PreferredStore>('/auth/preferred-stores/add/', {
        store_id: storeId,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Remove preferred store
  async removePreferredStore(storeId: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/auth/preferred-stores/${storeId}/remove/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Check if store is preferred
  async isStorePreferred(storeId: number): Promise<boolean> {
    try {
      const response = await api.get<{ is_preferred: boolean }>(
        `/auth/preferred-stores/${storeId}/check/`
      );
      return response.data.is_preferred;
    } catch (error) {
      console.error('Error checking preferred store:', error);
      return false;
    }
  }
}

export default new AuthService();