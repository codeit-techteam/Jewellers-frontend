import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const heroImage = require('@assets/images/onboarding-bg.png') as number;

export default function StoreLiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height, h1, body, button } = useFontScale();

  const heroHeight = height * 0.4;

  const handleGoToDashboard = () => {
    router.replace('/(app)');
  };

  const handleViewStore = () => {
    router.replace('/(app)/my-live-store' as Href);
  };

  return (
    <View
      className="flex-1 bg-white px-5"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}
    >
      <StatusBar style="dark" />

      <View className="mb-4 flex-row items-center">
        <Pressable
          onPress={handleGoToDashboard}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
          accessibilityLabel="Go to dashboard"
        >
          <Ionicons name="close" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-semibold"
          style={{ fontSize: body * 1.15, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          Store is Live!
        </Text>
      </View>

      <View className="relative overflow-hidden rounded-xl" style={{ height: heroHeight }}>
        <Image
          source={heroImage}
          style={{ width: '100%', height: heroHeight }}
          resizeMode="cover"
        />
        <Animated.View
          entering={ZoomIn.delay(500).duration(600)}
          className="absolute items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            backgroundColor: colors.WHITE,
            bottom: -26,
            alignSelf: 'center',
            left: '50%',
            marginLeft: -26,
            shadowColor: colors.BLACK,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Ionicons name="sparkles" size={28} color={colors.NAVY} />
        </Animated.View>
      </View>

      <Animated.Text
        entering={FadeInUp.delay(300).duration(600)}
        className="mt-10 text-center font-bold"
        style={{ fontSize: h1, color: colors.NAVY }}
      >
        Your Store is Ready!
      </Animated.Text>

      <Animated.Text
        entering={FadeInUp.delay(300).duration(600)}
        className="mt-4 text-center leading-relaxed"
        style={{ fontSize: body, color: colors.BODY_TEXT, paddingHorizontal: width * 0.04 }}
      >
        Congratulations! Your luxury jewelry storefront is now live and ready to receive your
        first customers.
      </Animated.Text>

      <View className="flex-1" />

      <Pressable
        onPress={handleGoToDashboard}
        className="mb-3 items-center justify-center rounded-xl py-4"
        style={{ backgroundColor: colors.NAVY }}
        accessibilityRole="button"
        accessibilityLabel="Go to Dashboard"
      >
        <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
          Go to Dashboard
        </Text>
      </Pressable>

      <Pressable
        onPress={handleViewStore}
        className="items-center justify-center rounded-xl border py-4"
        style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
        accessibilityRole="button"
        accessibilityLabel="View My Live Store"
      >
        <Text className="font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
          View My Live Store
        </Text>
      </Pressable>
    </View>
  );
}
