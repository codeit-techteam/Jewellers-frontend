import { Stack } from 'expo-router';

// Ensures that when navigating directly to a nested route (e.g. /inventory/add
// from onboarding), Expo Router always places the index screen at the base of
// the stack. This prevents "add" from being the only entry in the stack and
// makes router.back() reliably return to the inventory list.
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function InventoryLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
