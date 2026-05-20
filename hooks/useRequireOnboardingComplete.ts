import { getResumeRoute } from '@lib/getResumeRoute';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Redirects to the correct onboarding step when the store is not yet complete.
 * Use on app screens that must not be reachable before onboarding finishes.
 */
export function useRequireOnboardingComplete(): void {
  const router = useRouter();
  const isOnboardingComplete = useOnboardingStore((state) => state.isOnboardingComplete);
  const currentOnboardingStep = useOnboardingStore((state) => state.currentOnboardingStep);

  useEffect(() => {
    if (!isOnboardingComplete) {
      router.replace(getResumeRoute(false, currentOnboardingStep));
    }
  }, [isOnboardingComplete, currentOnboardingStep, router]);
}
