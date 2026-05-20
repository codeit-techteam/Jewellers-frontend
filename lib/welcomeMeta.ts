import * as SecureStore from 'expo-secure-store';

export const WELCOME_SEEN_KEY = 'welcome_seen';

export async function loadWelcomeSeen(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(WELCOME_SEEN_KEY);
  return value === 'true';
}

export async function setWelcomeSeen(): Promise<void> {
  await SecureStore.setItemAsync(WELCOME_SEEN_KEY, 'true');
}

export async function clearWelcomeSeen(): Promise<void> {
  await SecureStore.deleteItemAsync(WELCOME_SEEN_KEY);
}
