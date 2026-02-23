import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Store token and user data
        await SecureStore.setItemAsync('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        setToken(token);
        setUser(user);
        return user;
      } else {
        throw new Error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
      throw new Error(message);
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      const response = await authAPI.register({ name, email, phone, password });
      
      if (response.success) {
        const { user, token } = response.data;
        
        // Store token and user data
        await SecureStore.setItemAsync('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        setToken(token);
        setUser(user);
      } else {
        throw new Error(response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Đăng ký thất bại';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      // Clear stored data
      await SecureStore.deleteItemAsync('userToken');
      await AsyncStorage.removeItem('userData');
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    isAdmin: !!user && user.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
