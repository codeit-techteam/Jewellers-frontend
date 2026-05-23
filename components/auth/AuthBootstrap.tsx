import { useAuthStore } from '@store/useAuthStore';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

/**
 * Route guard: kicks unauthenticated users out of protected route groups.
 * Initial authenticated routing (cold start) is handled by _layout.tsx via
 * GET /onboarding/resume. AuthBootstrap only protects — it does not route
 * authenticated users so it cannot conflict with _layout.tsx.
 */
export function AuthBootstrap() {
  const router = useRouter();
  const segments = useSegments();
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isLoading) return;

    const inProtectedGroup =
      segments[0] === '(app)' || segments[0] === '(onboarding)';

    if (!isAuthenticated && inProtectedGroup) {
      router.replace('/');
      void SplashScreen.hideAsync();
    }
  }, [isLoading, isAuthenticated, segments, router]);

  return null;
}
