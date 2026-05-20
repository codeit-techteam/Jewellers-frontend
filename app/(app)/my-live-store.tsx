import { colors } from '@constants/colors';
import {
  MANAGE_STORE_ACTIONS,
  STORE_MANAGING_SINCE,
  STORE_PREMIUM_TIER_LABEL,
} from '@constants/storeApp';
import { useRequireOnboardingComplete } from '@hooks/useRequireOnboardingComplete';
import { getPerformanceSnapshot } from '@services/storeAppService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { showComingSoonAlert, showShareComingSoonAlert } from '@utils/storeAlerts';
import { Ionicons } from '@expo/vector-icons';
import {
  RETURN_TO_MY_LIVE_STORE,
  RETURN_TO_PROFILE,
  navigateBack,
} from '@lib/navigateBack';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVY_BANNER = '#1B2B4B';

type PerformanceStats = {
  views: number;
  leads: number;
};

export default function MyLiveStoreScreen() {
  useRequireOnboardingComplete();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;
  const button = width * 0.042;

  const step1 = useOnboardingStore((state) => state.step1);
  const step4 = useOnboardingStore((state) => state.step4);
  const products = useOnboardingStore((state) => state.products);

  const storeName = step1?.businessName ?? 'Your Store';
  const logoUri = step4?.logoUri ?? null;
  const coverImageUri = step4?.coverImageUri ?? null;
  const storeInitial = storeName.trim().charAt(0).toUpperCase() || 'S';
  const productCount = products.length;

  const [performance, setPerformance] = useState<PerformanceStats>({ views: 0, leads: 0 });

  useEffect(() => {
    let mounted = true;
    void getPerformanceSnapshot().then((snapshot) => {
      if (mounted) {
        setPerformance(snapshot);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleManageAction = (action: (typeof MANAGE_STORE_ACTIONS)[number]) => {
    if (action.comingSoon) {
      showComingSoonAlert();
      return;
    }
    if (action.route) {
      router.push({
        pathname: action.route,
        ...(returnTo ? { params: { returnTo } } : {}),
      } as Href);
    }
  };

  const statCards = [
    { label: 'VIEWS', value: String(performance.views) },
    { label: 'PRODUCTS', value: String(productCount) },
    { label: 'LEADS', value: String(performance.leads) },
  ];

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <View className="flex-row items-center px-5">
        <Pressable
          onPress={() => navigateBack(router, returnTo)}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          My Live Store
        </Text>
        <Pressable
          onPress={showShareComingSoonAlert}
          className="h-10 w-10 items-center justify-center"
          accessibilityLabel="Share store"
        >
          <Ionicons name="share-outline" size={width * 0.055} color={colors.NAVY} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-3 overflow-hidden rounded-xl" style={{ height: width * 0.52 }}>
          {coverImageUri ? (
            <ImageBackground
              source={{ uri: coverImageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            >
              <View className="flex-1">
                <View
                  className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-1"
                  style={{ backgroundColor: colors.NAVY }}
                >
                  <Ionicons name="checkmark-circle" size={micro * 1.2} color={colors.SUCCESS} />
                  <Text className="ml-1 font-semibold" style={{ fontSize: micro, color: colors.WHITE }}>
                    VERIFIED
                  </Text>
                </View>
                <View
                  className="absolute bottom-0 left-0 right-0 justify-end px-4 pb-4 pt-10"
                  style={{ backgroundColor: colors.OVERLAY_DARK }}
                >
                  <View className="flex-row items-center">
                    <View
                      className="items-center justify-center overflow-hidden rounded-full"
                      style={{
                        width: 52,
                        height: 52,
                        backgroundColor: logoUri ? colors.WHITE : colors.SURFACE_MUTED,
                      }}
                    >
                      {logoUri ? (
                        <Image
                          source={{ uri: logoUri }}
                          style={{ width: 52, height: 52 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
                          {storeInitial}
                        </Text>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-bold" style={{ fontSize: h2, color: colors.WHITE }}>
                        {storeName}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <View
                          className="mr-2 rounded-full"
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: colors.SUCCESS,
                          }}
                        />
                        <Text style={{ fontSize: label, color: colors.WHITE }}>Store is Live</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ImageBackground>
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: NAVY_BANNER }}>
              <View
                className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-1"
                style={{ backgroundColor: colors.NAVY }}
              >
                <Ionicons name="checkmark-circle" size={micro * 1.2} color={colors.SUCCESS} />
                <Text className="ml-1 font-semibold" style={{ fontSize: micro, color: colors.WHITE }}>
                  VERIFIED
                </Text>
              </View>
              <View
                className="absolute bottom-0 left-0 right-0 justify-end px-4 pb-4 pt-10"
                style={{ backgroundColor: colors.OVERLAY_DARK }}
              >
                <View className="flex-row items-center">
                  <View
                    className="items-center justify-center overflow-hidden rounded-full"
                    style={{
                      width: 52,
                      height: 52,
                      backgroundColor: logoUri ? colors.WHITE : colors.SURFACE_MUTED,
                    }}
                  >
                    {logoUri ? (
                      <Image
                        source={{ uri: logoUri }}
                        style={{ width: 52, height: 52 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
                        {storeInitial}
                      </Text>
                    )}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold" style={{ fontSize: h2, color: colors.WHITE }}>
                      {storeName}
                    </Text>
                    <View className="mt-1 flex-row items-center">
                      <View
                        className="mr-2 rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          backgroundColor: colors.SUCCESS,
                        }}
                      />
                      <Text style={{ fontSize: label, color: colors.WHITE }}>Store is Live</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          <View>
            <Text
              className="font-semibold uppercase tracking-wider"
              style={{ fontSize: micro, color: colors.GOLD }}
            >
              {STORE_PREMIUM_TIER_LABEL}
            </Text>
            <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>
              Managing since {STORE_MANAGING_SINCE}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(app)/storefront',
                params:
                  returnTo === RETURN_TO_PROFILE
                    ? { returnTo: RETURN_TO_MY_LIVE_STORE }
                    : undefined,
              })
            }
            className="rounded-full border px-4 py-2"
            style={{ borderColor: colors.NAVY }}
          >
            <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
              Visit Storefront
            </Text>
          </Pressable>
        </View>

        <Text className="mt-5 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          Performance Snapshot
        </Text>
        <View className="mt-3 flex-row" style={{ gap: width * 0.025 }}>
          {statCards.map((stat) => (
            <View
              key={stat.label}
              className="flex-1 items-center rounded-xl border py-4"
              style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
            >
              <Text
                className="uppercase tracking-wide"
                style={{ fontSize: micro, color: colors.BODY_TEXT }}
              >
                {stat.label}
              </Text>
              <Text className="mt-1 font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        <Text className="mt-5 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          Manage Your Store
        </Text>
        <View className="mt-3 flex-row flex-wrap" style={{ gap: width * 0.03 }}>
          {MANAGE_STORE_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handleManageAction(action)}
              className="rounded-xl border p-4"
              style={{
                flex: 1,
                flexBasis: '47%',
                minWidth: '47%',
                borderColor: colors.BORDER,
                backgroundColor: colors.WHITE,
              }}
            >
              <Ionicons name={action.icon} size={width * 0.065} color={colors.NAVY} />
              <Text className="mt-3 font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View
        className="border-t bg-white px-5 pt-3"
        style={{ borderColor: colors.BORDER, paddingBottom: insets.bottom + 12 }}
      >
        <Pressable
          onPress={() => router.replace('/(app)')}
          className="items-center justify-center rounded-xl py-4"
          style={{ backgroundColor: colors.NAVY }}
          accessibilityRole="button"
          accessibilityLabel="Go to Dashboard"
        >
          <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
            Go to Dashboard
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
