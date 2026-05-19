import { useAuthStore } from '@store/useAuthStore';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';

export function AuthBootstrap() {
  const router = useRouter();
  const segments = useSegments();
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkPersistedAuth = useAuthStore((state) => state.checkPersistedAuth);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (!hasBootstrapped.current) {
      hasBootstrapped.current = true;
      void checkPersistedAuth();
    }
  }, [checkPersistedAuth]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (isAuthenticated && !inAppGroup) {
      router.replace('/(app)/dashboard');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/dashboard');
      return;
    }

    if (!isAuthenticated && inAppGroup) {
      router.replace('/');
    }

    void SplashScreen.hideAsync();
  }, [isAuthenticated, isLoading, router, segments]);

  return null;
}
