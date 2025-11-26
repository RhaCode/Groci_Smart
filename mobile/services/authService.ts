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
  is_staff: boolean; 
  is_superuser: boolean;
  date_joined: string;
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

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

class AuthService {
  // Current user cache
  private currentUser: User | null = null;

  // Store token securely
  private async storeToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
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
        localStorage.removeItem('currentUser');
      } else {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('currentUser');
      }
      this.currentUser = null;
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Store user data locally
  private async storeUser(user: User): Promise<void> {
    try {
      this.currentUser = user;
      const userData = JSON.stringify(user);
      
      if (Platform.OS === 'web') {
        localStorage.setItem('currentUser', userData);
      } else {
        await SecureStore.setItemAsync('currentUser', userData);
      }
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  // Get stored user data
  async getStoredUser(): Promise<User | null> {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      let userData: string | null;
      
      if (Platform.OS === 'web') {
        userData = localStorage.getItem('currentUser');
      } else {
        userData = await SecureStore.getItemAsync('currentUser');
      }

      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }

      return null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  // Check if current user is staff
  async isStaff(): Promise<boolean> {
    const user = await this.getStoredUser();
    return user?.is_staff || false;
  }

  // Check if current user is superuser
  async isSuperuser(): Promise<boolean> {
    const user = await this.getStoredUser();
    return user?.is_superuser || false;
  }

  // Get current user (from cache or storage)
  async getCurrentUser(): Promise<User | null> {
    return await this.getStoredUser();
  }

  // Login
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await api.post<AuthResponse>('/auth/login/', credentials);
      const { token, user } = response.data;
      
      // Store token and user
      await this.storeToken(token);
      await this.storeUser(user);
      
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
      
      // Store token and user
      await this.storeToken(token);
      await this.storeUser(user);
      
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
      // Always remove token and user data locally
      await this.removeToken();
    }
  }

  // Get current user profile (fresh from server)
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<User>('/auth/profile/');
      // Update stored user
      await this.storeUser(response.data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update user profile
  async updateProfile(data: Partial<User & UserProfile>): Promise<User> {
    try {
      const response = await api.put<User>('/auth/profile/update/', data);
      // Update stored user
      await this.storeUser(response.data);
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

  // ===================== USER MANAGEMENT (ADMIN ONLY) =====================

  // Get all users
  async getUsers(search?: string): Promise<User[]> {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.get<User[]>(`/auth/users/${params}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Get user by ID
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await api.get<User>(`/auth/users/${userId}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Create user (superuser only)
  async createUser(data: CreateUserData): Promise<User> {
    try {
      const response = await api.post<User>('/auth/users/create/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Update user (superuser only)
  async updateUser(userId: number, data: UpdateUserData): Promise<User> {
    try {
      const response = await api.patch<User>(`/auth/users/${userId}/update/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // Delete user (superuser only)
  async deleteUser(userId: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/auth/users/${userId}/delete/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default new AuthService();