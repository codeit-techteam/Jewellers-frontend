import { getResumeRoute } from '@lib/getResumeRoute';
import { useAuthStore } from '@store/useAuthStore';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';

export function AuthBootstrap() {
  const router = useRouter();
  const segments = useSegments();
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasSeenWelcome = useAuthStore((state) => state.hasSeenWelcome);
  const isOnboardingComplete = useOnboardingStore((state) => state.isOnboardingComplete);
  const currentOnboardingStep = useOnboardingStore((state) => state.currentOnboardingStep);
  const hasHandledInitialAppRoute = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const onboardingScreen = segments[1];
    const appScreen = segments[1];
    const onLandingScreen = !inAuthGroup && !inAppGroup && !inOnboardingGroup;
    const resumeRoute = getResumeRoute(isOnboardingComplete, currentOnboardingStep);

    if (!isAuthenticated) {
      if (inAppGroup || inOnboardingGroup) {
        router.replace('/');
      }
      void SplashScreen.hideAsync();
      return;
    }

    // First launch / fresh install: keep marketing landing until user taps Get Started or Login
    if (!hasSeenWelcome && onLandingScreen) {
      void SplashScreen.hideAsync();
      return;
    }

    if (isOnboardingComplete) {
      if (
        !hasHandledInitialAppRoute.current &&
        inAppGroup &&
        appScreen === 'my-live-store'
      ) {
        hasHandledInitialAppRoute.current = true;
        router.replace(resumeRoute);
        void SplashScreen.hideAsync();
        return;
      }
      hasHandledInitialAppRoute.current = true;

      if ((onLandingScreen && hasSeenWelcome) || inAuthGroup) {
        router.replace(resumeRoute);
        void SplashScreen.hideAsync();
        return;
      }

      if (inOnboardingGroup && onboardingScreen !== 'store-live') {
        router.replace(resumeRoute);
        void SplashScreen.hideAsync();
        return;
      }
    } else {
      hasHandledInitialAppRoute.current = true;

      if (
        (onLandingScreen && hasSeenWelcome) ||
        inAppGroup ||
        inAuthGroup
      ) {
        router.replace(resumeRoute);
        void SplashScreen.hideAsync();
        return;
      }
    }

    void SplashScreen.hideAsync();
  }, [
    hasSeenWelcome,
    isAuthenticated,
    isLoading,
    isOnboardingComplete,
    currentOnboardingStep,
    router,
    segments,
  ]);

  return null;
}
