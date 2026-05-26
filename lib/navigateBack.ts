import type { Router } from 'expo-router';

export const RETURN_TO_PROFILE = 'profile';
export const RETURN_TO_MY_LIVE_STORE = 'my-live-store';
/** Returned to My Live Store where My Live Store was itself opened from Profile. */
export const RETURN_TO_MY_LIVE_STORE_FROM_PROFILE = 'my-live-store:profile';
export const RETURN_TO_STEP5_PRODUCTS = 'step5-products';
export const RETURN_TO_HOME = 'home';
export const RETURN_TO_INVENTORY = 'inventory';

function normalizeReturnTo(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/** Navigate back to the screen the user came from (tabs do not stack with router.back). */
export function navigateBack(
  router: Router,
  returnTo?: string | string[],
): void {
  const target = normalizeReturnTo(returnTo);

  if (target === RETURN_TO_PROFILE) {
    router.navigate('/(app)/profile');
    return;
  }

  if (target === RETURN_TO_MY_LIVE_STORE_FROM_PROFILE) {
    router.navigate({
      pathname: '/(app)/my-live-store',
      params: { returnTo: RETURN_TO_PROFILE },
    });
    return;
  }

  if (target === RETURN_TO_MY_LIVE_STORE) {
    router.navigate('/(app)/my-live-store');
    return;
  }

  if (target === RETURN_TO_STEP5_PRODUCTS) {
    router.navigate('/(onboarding)/step5-products');
    return;
  }

  if (target === RETURN_TO_HOME) {
    router.navigate('/(app)');
    return;
  }

  if (target === RETURN_TO_INVENTORY) {
    router.navigate('/(app)/inventory');
    return;
  }

  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/(app)');
}
