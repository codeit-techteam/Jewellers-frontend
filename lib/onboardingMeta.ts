import * as SecureStore from 'expo-secure-store';

export const ONBOARDING_META_KEY = 'onboarding_meta';

export type OnboardingMeta = {
  currentOnboardingStep: number;
  isOnboardingComplete: boolean;
  /** Last known store_status from the server — used for offline fallback routing. */
  storeStatus?: string;
};

export async function saveOnboardingMeta(meta: OnboardingMeta): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_META_KEY, JSON.stringify(meta));
}

export async function loadOnboardingMeta(): Promise<OnboardingMeta | null> {
  const raw = await SecureStore.getItemAsync(ONBOARDING_META_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as OnboardingMeta;
    if (
      typeof parsed.currentOnboardingStep === 'number' &&
      typeof parsed.isOnboardingComplete === 'boolean'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearOnboardingMeta(): Promise<void> {
  await SecureStore.deleteItemAsync(ONBOARDING_META_KEY);
}
