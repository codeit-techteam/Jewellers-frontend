import '../global.css';

import { AuthBootstrap } from '@components/auth/AuthBootstrap';
import { DialogProvider } from '@providers/DialogProvider';
import { QueryProvider } from '@providers/QueryProvider';
import { getStatus } from '@services/onboardingService';
import { saveOnboardingMeta } from '@lib/onboardingMeta';
import { getResumeRoute } from '@lib/getResumeRoute';
import { useAppStore } from '@store/useAppStore';
import { useAuthStore } from '@store/useAuthStore';
import { useRouter, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const checkPersistedAuth = useAuthStore((state) => state.checkPersistedAuth);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasRoutedRef = useRef(false);

  useEffect(() => {
    void checkPersistedAuth();
  }, [checkPersistedAuth]);

  // After auth settles: fetch fresh onboarding status from API and route accordingly.
  // Never rely solely on local meta — always confirm with the server on boot.
  useEffect(() => {
    if (isLoading || hasRoutedRef.current) return;
    hasRoutedRef.current = true;

    if (!isAuthenticated) {
      void SplashScreen.hideAsync();
      return;
    }

    void (async () => {
      try {
        const status = await getStatus();

        // Persist fresh server state so offline fallback stays accurate.
        void saveOnboardingMeta({
          currentOnboardingStep: status.onboardingStep,
          isOnboardingComplete: status.isOnboardingComplete,
          storeStatus: status.storeStatus,
        });

        const route = getResumeRoute(
          status.isOnboardingComplete,
          status.onboardingStep,
          status.storeStatus,
        );
        router.replace(route);
      } catch {
        // API unreachable — fall back to whatever checkPersistedAuth loaded from SecureStore.
        const { isOnboardingComplete, onboardingStep } = useAuthStore.getState();
        const route = getResumeRoute(isOnboardingComplete, onboardingStep);
        router.replace(route);
      } finally {
        void SplashScreen.hideAsync();
      }
    })();
  }, [isLoading, isAuthenticated, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <DialogProvider>
            <AuthBootstrap />
            <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }} />
          </DialogProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
