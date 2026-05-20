import { saveOnboardingMeta } from '@lib/onboardingMeta';

export function persistOnboardingProgress(
  currentOnboardingStep: number,
  isOnboardingComplete: boolean,
): void {
  void saveOnboardingMeta({ currentOnboardingStep, isOnboardingComplete });
}
