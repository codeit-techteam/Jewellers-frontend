import { loadOnboardingMeta, saveOnboardingMeta } from '@lib/onboardingMeta';

/**
 * Saves onboarding step progress while preserving all other fields already in
 * SecureStore (phone, storeStatus, needsSubscription).  Merging prevents a
 * bare step-save from wiping the phone we stored at login.
 */
export function persistOnboardingProgress(
  currentOnboardingStep: number,
  isOnboardingComplete: boolean,
): void {
  void (async () => {
    const existing = await loadOnboardingMeta();
    await saveOnboardingMeta({
      ...existing,
      currentOnboardingStep,
      isOnboardingComplete,
    });
  })();
}
