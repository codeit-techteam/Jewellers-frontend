import { clearAuthToken, setAuthToken } from '@services/api';
import type { User } from '@/types/auth';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const AUTH_TOKEN_KEY = 'auth_token';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  setPhoneForOtp: (phone: string, countryCode: string) => void;
  setAuthSuccess: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkPersistedAuth: () => Promise<void>;
  clearOtpSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  phoneNumber: null,
  countryCode: null,

  setPhoneForOtp: (phone, countryCode) => {
    set({ phoneNumber: phone, countryCode });
  },

  setAuthSuccess: async (token, user) => {
    await setAuthToken(token);
    set({
      isAuthenticated: true,
      token,
      user,
      phoneNumber: null,
      countryCode: null,
    });
  },

  logout: async () => {
    await clearAuthToken();
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      phoneNumber: null,
      countryCode: null,
    });
  },

  checkPersistedAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        set({
          isAuthenticated: true,
          token,
          isLoading: false,
        });
        return;
      }
      set({ isAuthenticated: false, token: null, isLoading: false });
    } catch {
      set({ isAuthenticated: false, token: null, isLoading: false });
    }
  },

  clearOtpSession: () => {
    set({ phoneNumber: null, countryCode: null });
  },
}));
