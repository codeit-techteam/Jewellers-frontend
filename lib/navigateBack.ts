import type { Router } from 'expo-router';

export const RETURN_TO_PROFILE = 'profile';
export const RETURN_TO_MY_LIVE_STORE = 'my-live-store';

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

  if (target === RETURN_TO_MY_LIVE_STORE) {
    router.navigate({
      pathname: '/(app)/my-live-store',
      params: { returnTo: RETURN_TO_PROFILE },
    });
    return;
  }

  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/(app)');
}
