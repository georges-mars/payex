// src/utils/secureStore.ts
import { Platform } from 'react-native';

// Custom SecureStore implementation
class CustomSecureStore {
  private static instance: CustomSecureStore;
  
  private constructor() {}
  
  static getInstance(): CustomSecureStore {
    if (!CustomSecureStore.instance) {
      CustomSecureStore.instance = new CustomSecureStore();
    }
    return CustomSecureStore.instance;
  }
  
  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      // Try to use expo-secure-store
      const { setItemAsync: expoSetItem } = await import('expo-secure-store');
      return await expoSetItem(key, value);
    } catch (error) {
      console.warn('expo-secure-store failed, using fallback:', error);
      
      // Fallback for web or when expo-secure-store fails
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        // For React Native, use AsyncStorage as fallback
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        return AsyncStorage.setItem(key, value);
      }
    }
  }
  
  async getItemAsync(key: string): Promise<string | null> {
    try {
      const { getItemAsync: expoGetItem } = await import('expo-secure-store');
      return await expoGetItem(key);
    } catch (error) {
      console.warn('expo-secure-store failed, using fallback:', error);
      
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        return AsyncStorage.getItem(key);
      }
    }
  }
  
  async deleteItemAsync(key: string): Promise<void> {
    try {
      const { deleteItemAsync: expoDelete } = await import('expo-secure-store');
      return await expoDelete(key);
    } catch (error) {
      console.warn('expo-secure-store failed, using fallback:', error);
      
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        return AsyncStorage.removeItem(key);
      }
    }
  }
}

export const secureStore = CustomSecureStore.getInstance();