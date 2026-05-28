import type { Href } from 'expo-router';

/**
 * Returns the route a jeweller should land on based on onboarding progress.
 * storeStatus takes priority over step number when it indicates a terminal state.
 * needsSubscription is only relevant when storeStatus === 'approved'.
 */
export function getResumeRoute(
  isOnboardingComplete: boolean,
  currentStep: number,
  storeStatus?: string,
  needsSubscription?: boolean,
): Href {
  if (storeStatus === 'approved') {
    // Store approved but plan not yet chosen → subscription selection
    if (needsSubscription) {
      return '/(onboarding)/post-approval-subscription';
    }
    return '/(app)';
  }

  if (isOnboardingComplete) {
    return '/(app)';
  }

  if (storeStatus === 'review' || storeStatus === 'rejected') {
    return '/(onboarding)/review-pending';
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
    case 6:
      return '/(onboarding)/step5-products';
    case 7:
      return '/(onboarding)/review-pending';
    default:
      return '/';
  }
}
