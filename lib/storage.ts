import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage abstraction backed by AsyncStorage today.
 * Swap implementation to MMKV in a Dev Build without changing call sites.
 */
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async getObject<T>(key: string): Promise<T | null> {
    const raw = await storage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setObject<T>(key: string, value: T): Promise<void> {
    await storage.setItem(key, JSON.stringify(value));
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};

export default storage;

export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
} as const;
