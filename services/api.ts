import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Platform-aware token storage (SecureStore không hỗ trợ web)
export const tokenStorage = {
  getToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem('userToken');
    }
    return SecureStore.getItemAsync('userToken');
  },
  setToken: async (token: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem('userToken', token);
      return;
    }
    await SecureStore.setItemAsync('userToken', token);
  },
  removeToken: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('userToken');
      return;
    }
    await SecureStore.deleteItemAsync('userToken');
  },
};

// Base URL - tự detect platform
// Web: localhost, Android emulator: 10.0.2.2, iOS simulator: localhost
const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : Platform.OS === 'android'
      ? 'http://10.0.2.2:5000/api'
      : 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear stored data
      await SecureStore.deleteItemAsync('userToken');
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Food & Order API functions
export const foodAPI = {
  // Get all available foods
  getFoods: async (category?: string) => {
    const params: any = {};
    if (category) params.category = category;
    const response = await api.get('/foods', { params });
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await api.get('/foods/categories');
    return response.data;
  },

  // Seed foods
  seedFoods: async () => {
    const response = await api.post('/foods/seed');
    return response.data;
  },
};

export const orderAPI = {
  // Create new order
  createOrder: async (payload: {
    items: { foodId: string; quantity: number }[];
    address: string;
    note?: string;
  }) => {
    const response = await api.post('/orders', payload);
    return response.data;
  },

  // Get current user's orders
  getMyOrders: async () => {
    const response = await api.get('/orders/my');
    return response.data;
  },
};

// Admin API functions
export const adminAPI = {
  // Get dashboard stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get all foods (including unavailable)
  getFoods: async () => {
    const response = await api.get('/admin/foods');
    return response.data;
  },

  // Create new food
  createFood: async (foodData: {
    name: string;
    description?: string;
    price: number;
    image?: string;
    category?: string;
  }) => {
    const response = await api.post('/admin/foods', foodData);
    return response.data;
  },

  // Update food
  updateFood: async (id: string, foodData: {
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    category?: string;
    isAvailable?: boolean;
  }) => {
    const response = await api.put(`/admin/foods/${id}`, foodData);
    return response.data;
  },

  // Delete food
  deleteFood: async (id: string) => {
    const response = await api.delete(`/admin/foods/${id}`);
    return response.data;
  },

  // Get all orders
  getOrders: async () => {
    const response = await api.get('/admin/orders');
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.put(`/admin/orders/${id}/status`, { status });
    return response.data;
  },
};

export default api;
