import '../global.css';

import { AuthBootstrap } from '@components/auth/AuthBootstrap';
import { DialogProvider } from '@providers/DialogProvider';
import { QueryProvider } from '@providers/QueryProvider';
import { getStatus } from '@services/onboardingService';
import { onAuthReset } from '@lib/authEvents';
import { loadOnboardingMeta, saveOnboardingMeta } from '@lib/onboardingMeta';
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

/** Returns true when the route is an in-progress onboarding step screen. */
function isOnboardingStepRoute(route: unknown): boolean {
  return typeof route === 'string' && (route as string).includes('/(onboarding)/step');
}

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

  // Allow post-logout re-login to re-run the authenticated cold-start router.
  useEffect(() => {
    return onAuthReset(() => {
      hasRoutedRef.current = false;
    });
  }, []);

  // After auth settles: route immediately using local persisted state (no network wait),
  // hide the splash, then silently validate with the server in the background.
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (hasRoutedRef.current) return;
      hasRoutedRef.current = true;
      void SplashScreen.hideAsync();
      return;
    }

    if (hasRoutedRef.current) return;
    hasRoutedRef.current = true;

    void (async () => {
      // ── Phase 1: instant routing from local state ──────────────────────────
      // checkPersistedAuth already restored isOnboardingComplete / onboardingStep /
      // storeStatus from SecureStore. Only needsSubscription isn't in the Zustand
      // store, so we read the full meta once (fast SecureStore read, no network).
      const { isOnboardingComplete, onboardingStep, storeStatus } = useAuthStore.getState();
      const localMeta = await loadOnboardingMeta().catch(() => null);

      const localRoute = getResumeRoute(
        isOnboardingComplete,
        onboardingStep,
        storeStatus ?? undefined,
        localMeta?.needsSubscription,
      );

      const resolveRoute = (r: ReturnType<typeof getResumeRoute>) =>
        isOnboardingStepRoute(r) ? '/(onboarding)/resume-choice' : (r as string);

      router.replace(resolveRoute(localRoute) as Parameters<typeof router.replace>[0]);
      void SplashScreen.hideAsync(); // ← Splash gone now; no network wait

      // ── Phase 2: background server validation ──────────────────────────────
      // Quietly fetch the authoritative status and re-route only when the server
      // returns a destination that differs from what we already showed.
      try {
        const status = await getStatus();

        void saveOnboardingMeta({
          currentOnboardingStep: status.onboardingStep,
          isOnboardingComplete: status.isOnboardingComplete,
          storeStatus: status.storeStatus,
          needsSubscription: status.needsSubscription,
          phone: useAuthStore.getState().user?.phone,
        });

        const serverRoute = getResumeRoute(
          status.isOnboardingComplete,
          status.onboardingStep,
          status.storeStatus,
          status.needsSubscription,
        );

        const resolvedServer = resolveRoute(serverRoute);
        const resolvedLocal = resolveRoute(localRoute);

        if (resolvedServer !== resolvedLocal) {
          router.replace(resolvedServer as Parameters<typeof router.replace>[0]);
        }
      } catch {
        // Server unreachable — local routing already in effect, nothing to do.
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
