import { clearOnboardingMeta, loadOnboardingMeta, saveOnboardingMeta } from '@lib/onboardingMeta';
import { clearWelcomeSeen, loadWelcomeSeen, setWelcomeSeen } from '@lib/welcomeMeta';
import { clearAuthToken, registerUnauthorizedHandler, setAuthToken } from '@services/api';
import * as authService from '@services/authService';
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

export const useAuthStore = create<AuthState>((set, get) => {
  const store = {
    ...initialAuthState,

    markWelcomeSeen: async () => {
      await setWelcomeSeen();
      set({ hasSeenWelcome: true });
    },

    setAuthFlowMode: (mode: AuthFlowMode) => {
      set({ authMode: mode });
    },

    setPhoneForOtp: (phone: string, countryCode: string) => {
      set({ phoneNumber: phone, countryCode });
    },

    setAuthSuccess: async (
      token: string,
      user: User,
      onboardingStep: number,
      isOnboardingComplete: boolean,
    ) => {
      await setAuthToken(token);
      await saveOnboardingMeta({ currentOnboardingStep: onboardingStep, isOnboardingComplete });

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
      await authService.logout();
      await clearAuthToken();
      await clearOnboardingMeta();
      await clearWelcomeSeen();
      useOnboardingStore.getState().resetOnboarding();
      set({ ...initialAuthState, isLoading: false });
    },

    checkPersistedAuth: async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

        if (!storedToken) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        // Validate token and restore user via /auth/me
        const user = await authService.getMe();
        const meta = await loadOnboardingMeta();
        const hasSeenWelcome = await loadWelcomeSeen();

        const onboardingStep = meta?.currentOnboardingStep ?? 1;
        const isOnboardingComplete = meta?.isOnboardingComplete ?? false;

        useOnboardingStore
          .getState()
          .hydrateOnboardingMeta(onboardingStep, isOnboardingComplete);

        set({
          isAuthenticated: true,
          token: storedToken,
          user,
          onboardingStep,
          isOnboardingComplete,
          hasSeenWelcome,
          isLoading: false,
        });
      } catch {
        // /auth/me failed (expired/invalid token) — clear everything
        await clearAuthToken();
        await clearOnboardingMeta();
        useOnboardingStore.getState().resetOnboarding();
        set({ isAuthenticated: false, token: null, isLoading: false });
      }
    },

    clearOtpSession: () => {
      set({ phoneNumber: null, countryCode: null, authMode: null });
    },
  };

  // Register 401 handler here — avoids circular imports (api → store → service → api)
  registerUnauthorizedHandler(() => {
    void store.logout();
  });

  return store;
});
