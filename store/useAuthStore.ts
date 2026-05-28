import { clearOnboardingMeta, loadOnboardingMeta, saveOnboardingMeta } from '@lib/onboardingMeta';
import { clearWelcomeSeen, loadWelcomeSeen, setWelcomeSeen } from '@lib/welcomeMeta';
import {
  clearAuthToken,
  primeTokenCache,
  registerUnauthorizedHandler,
  setAuthToken,
} from '@services/api';
import * as authService from '@services/authService';
import { useInventoryStore } from '@store/useInventoryStore';
import { useLeadsStore } from '@store/useLeadsStore';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { useProfileStore } from '@store/useProfileStore';
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
  storeStatus: string | null;
  hasSeenWelcome: boolean;
  markWelcomeSeen: () => Promise<void>;
  setAuthFlowMode: (mode: AuthFlowMode) => void;
  setPhoneForOtp: (phone: string, countryCode: string) => void;
  setAuthSuccess: (
    token: string,
    user: User,
    onboardingStep: number,
    isOnboardingComplete: boolean,
    storeStatus?: string | null,
    needsSubscription?: boolean,
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
  storeStatus: null as string | null,
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
      storeStatus?: string | null,
      needsSubscription?: boolean,
    ) => {
      const { phoneNumber } = get();

      // All three writes are independent — run them in parallel.
      await Promise.all([
        setAuthToken(token),
        saveOnboardingMeta({
          currentOnboardingStep: onboardingStep,
          isOnboardingComplete,
          storeStatus: storeStatus ?? undefined,
          needsSubscription: needsSubscription ?? undefined,
          phone: user.phone ?? phoneNumber ?? undefined,
        }),
        setWelcomeSeen(),
      ]);

      const onboarding = useOnboardingStore.getState();
      onboarding.hydrateOnboardingMeta(onboardingStep, isOnboardingComplete);
      if (isOnboardingComplete) {
        onboarding.completeOnboarding();
      }

      set({
        isAuthenticated: true,
        token,
        user,
        phoneNumber: phoneNumber,
        countryCode: get().countryCode,
        onboardingStep,
        isOnboardingComplete,
        storeStatus: storeStatus ?? null,
        hasSeenWelcome: true,
        authMode: null,
      });
    },

    logout: async () => {
      // API logout is best-effort; fire it alongside local cleanup in parallel.
      await Promise.allSettled([
        authService.logout(),
        clearAuthToken(),
        clearOnboardingMeta(),
        clearWelcomeSeen(),
      ]);

      // Reset all feature stores before clearing auth state
      useOnboardingStore.getState().resetOnboarding();
      useInventoryStore.getState().reset();
      useLeadsStore.getState().reset();
      useProfileStore.getState().reset();

      set({ ...initialAuthState, isLoading: false });
    },

    checkPersistedAuth: async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

        if (!storedToken) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        // Warm the in-memory cache so the /auth/me request interceptor skips SecureStore.
        primeTokenCache(storedToken);

        // Validate token via /auth/me; read local meta in parallel (independent reads).
        const [user, meta, hasSeenWelcome] = await Promise.all([
          authService.getMe(),
          loadOnboardingMeta(),
          loadWelcomeSeen(),
        ]);

        const onboardingStep = meta?.currentOnboardingStep ?? 1;
        const isOnboardingComplete = meta?.isOnboardingComplete ?? false;
        const storeStatus = meta?.storeStatus ?? null;

        useOnboardingStore.getState().hydrateOnboardingMeta(onboardingStep, isOnboardingComplete);

        set({
          isAuthenticated: true,
          token: storedToken,
          user,
          onboardingStep,
          isOnboardingComplete,
          storeStatus,
          hasSeenWelcome,
          isLoading: false,
        });
      } catch {
        // /auth/me failed (expired/invalid token) — clear everything
        await clearAuthToken();
        await clearOnboardingMeta();
        useOnboardingStore.getState().resetOnboarding();
        set({ isAuthenticated: false, token: null, storeStatus: null, isLoading: false });
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
