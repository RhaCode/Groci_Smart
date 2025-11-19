// mobile/services/api.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// API Configuration
const API_BASE_URL = 'http://10.40.14.34:8000/api';

// Helper function to get token (platform-aware)
const getAuthToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('authToken');
    } else {
      return await SecureStore.getItemAsync('authToken');
    }
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// Helper function to delete token (platform-aware)
const deleteAuthToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('authToken');
    } else {
      await SecureStore.deleteItemAsync('authToken');
    }
  } catch (error) {
    console.error('Error deleting auth token:', error);
  }
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Token ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          await deleteAuthToken();
          // You can emit an event here to trigger navigation
          console.log('Unauthorized - Token cleared');
          break;
        case 403:
          console.error('Forbidden - Access denied');
          break;
        case 404:
          console.error('Not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error(`Error ${status}:`, error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - No response received');
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Helper function to handle API errors
export const handleApiError = (error: any): ApiError => {
  if (error.response?.data) {
    const data = error.response.data;
    
    // Handle validation errors
    if (typeof data === 'object' && !data.message) {
      return {
        message: 'Validation error',
        errors: data,
        status: error.response.status,
      };
    }
    
    // Handle error with message
    return {
      message: data.message || data.error || 'An error occurred',
      status: error.response.status,
    };
  }
  
  // Network or other errors
  return {
    message: error.message || 'Network error occurred',
  };
};

// Multipart form data helper
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.keys(data).forEach((key) => {
    const value = data[key];
    
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && value.uri) {
        // File upload (image)
        formData.append(key, {
          uri: value.uri,
          type: value.type || 'image/jpeg',
          name: value.name || `upload_${Date.now()}.jpg`,
        } as any);
      } else if (Array.isArray(value)) {
        // Array values
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else {
        // Regular values
        formData.append(key, value.toString());
      }
    }
  });
  
  return formData;
};

export default api;