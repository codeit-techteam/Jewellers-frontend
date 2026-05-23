import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type OnboardingScreenHeaderProps = {
  title: string;
  onBack?: () => void;
};

export function OnboardingScreenHeader({ title, onBack }: OnboardingScreenHeaderProps) {
  const router = useRouter();
  const { h2, width } = useFontScale();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/step5-subscription');
    }
  };

  return (
    <View className="mb-4 flex-row items-center">
      <Pressable
        onPress={handleBack}
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.SURFACE_MUTED }}
      >
        <Text style={{ fontSize: h2, color: colors.NAVY }}>‹</Text>
      </Pressable>
      <Text
        className="flex-1 text-center font-semibold"
        style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
      >
        {title}
      </Text>
    </View>
  );
}
