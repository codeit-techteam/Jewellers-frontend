import type { Href } from 'expo-router';

/**
 * Returns the route a jeweller should land on based on onboarding progress.
 */
export function getResumeRoute(
  isOnboardingComplete: boolean,
  currentStep: number,
): Href {
  if (isOnboardingComplete) {
    return '/(app)';
  }

  switch (currentStep) {
    case 1:
      return '/(onboarding)/step1-business-info';
    case 2:
      return '/(onboarding)/step2-gst';
    case 3:
      return '/(onboarding)/step3-bis';
    case 4:
      return '/(onboarding)/step4-branding';
    case 5:
      return '/(onboarding)/step5-subscription';
    case 6:
      return '/(onboarding)/step5-products';
    case 7:
      return '/(onboarding)/review-pending';
    default:
      return '/(onboarding)/step1-business-info';
  }
}
