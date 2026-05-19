import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { useAuthStore } from '@store/useAuthStore';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { body, button } = useFontScale();
  const logout = useAuthStore((state) => state.logout);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);

  const handleLogout = async () => {
    await logout();
    resetOnboarding();
    router.replace('/');
  };

  return (
    <View
      className="flex-1 items-center justify-center bg-white px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Text style={{ fontSize: body, color: colors.NAVY }}>Dashboard placeholder</Text>
      <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>Authenticated area</Text>
      <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>Post-login screens go here</Text>

      <Pressable
        onPress={() => void handleLogout()}
        className="mt-8 items-center justify-center rounded-xl px-8 py-4"
        style={{ backgroundColor: colors.NAVY }}
        accessibilityRole="button"
        accessibilityLabel="Logout dev reset"
      >
        <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
          Logout (Dev Reset)
        </Text>
      </Pressable>
    </View>
  );
}
