import { clearOnboardingMeta, loadOnboardingMeta, saveOnboardingMeta } from '@lib/onboardingMeta';
import { clearWelcomeSeen, loadWelcomeSeen, setWelcomeSeen } from '@lib/welcomeMeta';
import { clearAuthToken, setAuthToken } from '@services/api';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { User } from '@/types/auth';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const AUTH_TOKEN_KEY = 'auth_token';

export type AuthFlowMode = 'register' | 'login';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  authMode: AuthFlowMode | null;
  onboardingStep: number;
  isOnboardingComplete: boolean;
  hasSeenWelcome: boolean;
  markWelcomeSeen: () => Promise<void>;
  setAuthFlowMode: (mode: AuthFlowMode) => void;
  setPhoneForOtp: (phone: string, countryCode: string) => void;
  setAuthSuccess: (
    token: string,
    user: User,
    onboardingStep: number,
    isOnboardingComplete: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkPersistedAuth: () => Promise<void>;
  clearOtpSession: () => void;
};

const initialAuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  phoneNumber: null,
  countryCode: null,
  authMode: null as AuthFlowMode | null,
  onboardingStep: 1,
  isOnboardingComplete: false,
  hasSeenWelcome: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialAuthState,

  markWelcomeSeen: async () => {
    await setWelcomeSeen();
    set({ hasSeenWelcome: true });
  },

  setAuthFlowMode: (mode) => {
    set({ authMode: mode });
  },

  setPhoneForOtp: (phone, countryCode) => {
    set({ phoneNumber: phone, countryCode });
  },

  setAuthSuccess: async (token, user, onboardingStep, isOnboardingComplete) => {
    await setAuthToken(token);
    await saveOnboardingMeta({
      currentOnboardingStep: onboardingStep,
      isOnboardingComplete,
    });

    const onboarding = useOnboardingStore.getState();
    onboarding.hydrateOnboardingMeta(onboardingStep, isOnboardingComplete);
    if (isOnboardingComplete) {
      onboarding.completeOnboarding();
    }

    const { phoneNumber, countryCode } = get();

    await setWelcomeSeen();

    set({
      isAuthenticated: true,
      token,
      user,
      phoneNumber,
      countryCode,
      onboardingStep,
      isOnboardingComplete,
      hasSeenWelcome: true,
      authMode: null,
    });
  },

  logout: async () => {
    await clearAuthToken();
    await clearOnboardingMeta();
    await clearWelcomeSeen();
    useOnboardingStore.getState().resetOnboarding();
    set({
      ...initialAuthState,
      isLoading: false,
    });
  },

  checkPersistedAuth: async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const meta = await loadOnboardingMeta();
      const hasSeenWelcome = await loadWelcomeSeen();

      if (storedToken && meta) {
        useOnboardingStore
          .getState()
          .hydrateOnboardingMeta(meta.currentOnboardingStep, meta.isOnboardingComplete);

        set({
          isAuthenticated: true,
          token: storedToken,
          onboardingStep: meta.currentOnboardingStep,
          isOnboardingComplete: meta.isOnboardingComplete,
          hasSeenWelcome,
          isLoading: false,
        });
        return;
      }

      if (storedToken && !meta) {
        await clearAuthToken();
      }

      useOnboardingStore.getState().resetOnboarding();

      set({
        isAuthenticated: false,
        token: null,
        hasSeenWelcome: false,
        isLoading: false,
      });
    } catch {
      useOnboardingStore.getState().resetOnboarding();
      set({
        isAuthenticated: false,
        token: null,
        hasSeenWelcome: false,
        isLoading: false,
      });
    }
  },

  clearOtpSession: () => {
    set({ phoneNumber: null, countryCode: null, authMode: null });
  },
}));
