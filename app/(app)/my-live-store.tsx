import { colors } from '@constants/colors';
import { MANAGE_STORE_ACTIONS } from '@constants/storeApp';
import dayjs from 'dayjs';
import { useRequireOnboardingComplete } from '@hooks/useRequireOnboardingComplete';
import { getOverview } from '@services/analyticsService';
import { getProducts } from '@services/inventoryService';
import { getStore } from '@services/storeService';
import { showComingSoonAlert, showShareComingSoonAlert } from '@utils/storeAlerts';
import { Ionicons } from '@expo/vector-icons';
import {
  RETURN_TO_MY_LIVE_STORE,
  RETURN_TO_MY_LIVE_STORE_FROM_PROFILE,
  RETURN_TO_PROFILE,
  navigateBack,
} from '@lib/navigateBack';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { usePullToRefresh } from '@hooks/usePullToRefresh';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVY_BANNER = '#1B2B4B';

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

  const storeQuery = useQuery({
    queryKey: ['store'],
    queryFn: getStore,
  });

  const overviewQuery = useQuery({
    queryKey: ['analytics', 'today'],
    queryFn: () => getOverview('today'),
  });

  const activeProductsQuery = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => getProducts({ status: 'active', is_draft: false }),
  });

  const store = storeQuery.data;
  const overview = overviewQuery.data;
  const activeProducts = activeProductsQuery.data ?? [];
  const storeLoading = storeQuery.isPending;

  const { isRefreshing: isLiveStoreRefreshing, onRefresh: onLiveStoreRefresh } = usePullToRefresh([
    storeQuery,
    overviewQuery,
    activeProductsQuery,
  ]);

  const storeName = store?.businessName ?? 'Your Store';
  const logoUri = store?.logoUrl ?? null;
  const coverImageUri = store?.coverImageUrl ?? null;
  const storeInitial = storeName.trim().charAt(0).toUpperCase() || 'S';
  const storeLocality = store?.locality ?? '';
  const storeHours =
    store?.openingTime && store?.closingTime
      ? `${store.openingTime} – ${store.closingTime}`
      : '';
  const productCount = activeProducts.length;
  // SUBSCRIPTION DISABLED - enable in future
  // const planLabel = store?.planName ?? 'Free Plan';
  // const planTierLabel = planLabel.toUpperCase();
  // const planSubtitle = memberSinceYear ? `${planLabel} · ${memberSinceYear}` : planLabel;
  const isLive = store?.storeStatus === 'approved';
  const isVerified = store?.storeStatus === 'approved';
  // SUBSCRIPTION DISABLED - enable in future
  // const memberSinceYear = (() => {
  //   const raw = store?.memberSince;
  //   if (!raw) return null;
  //   const d = dayjs(raw);
  //   return d.isValid() ? d.format('YYYY') : null;
  // })();

  const handleManageAction = (action: (typeof MANAGE_STORE_ACTIONS)[number]) => {
    if (action.comingSoon) {
      showComingSoonAlert();
      return;
    }
    if (action.route) {
      // Always return to My Live Store when the sub-page goes back,
      // regardless of how My Live Store itself was opened (e.g. from Profile).
      router.push({
        pathname: action.route,
        params: { returnTo: RETURN_TO_MY_LIVE_STORE },
      } as Href);
    }
  };

  const statCards = [
    { label: 'VIEWS', value: String(overview?.views ?? 0) },
    { label: 'PRODUCTS', value: String(productCount) },
    { label: 'LEADS', value: String(overview?.appointments ?? 0) },
  ];

  if (storeLoading && !store) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.NAVY} />
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={isLiveStoreRefreshing}
            onRefresh={onLiveStoreRefresh}
            tintColor={colors.NAVY}
          />
        }
      >
        <View className="mt-3 overflow-hidden rounded-xl" style={{ height: width * 0.52 }}>
          {coverImageUri ? (
            <ImageBackground
              source={{ uri: coverImageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            >
              <View className="flex-1">
                {isVerified ? (
                  <View
                    className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-1"
                    style={{ backgroundColor: colors.NAVY }}
                  >
                    <Ionicons name="checkmark-circle" size={micro * 1.2} color={colors.SUCCESS} />
                    <Text className="ml-1 font-semibold" style={{ fontSize: micro, color: colors.WHITE }}>
                      VERIFIED
                    </Text>
                  </View>
                ) : null}
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
                      {storeLocality ? (
                        <Text style={{ fontSize: micro, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                          📍 {storeLocality}
                        </Text>
                      ) : null}
                      <View className="mt-1 flex-row items-center">
                        <View
                          className="mr-2 rounded-full"
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: colors.SUCCESS,
                          }}
                        />
                        <Text style={{ fontSize: label, color: colors.WHITE }}>
                          {isLive ? 'Store is Live' : store?.storeStatus ?? 'Pending'}
                          {storeHours ? `  ·  ${storeHours}` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ImageBackground>
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: NAVY_BANNER }}>
              {isVerified ? (
                <View
                  className="absolute right-3 top-3 flex-row items-center rounded-full px-3 py-1"
                  style={{ backgroundColor: colors.NAVY }}
                >
                  <Ionicons name="checkmark-circle" size={micro * 1.2} color={colors.SUCCESS} />
                  <Text className="ml-1 font-semibold" style={{ fontSize: micro, color: colors.WHITE }}>
                    VERIFIED
                  </Text>
                </View>
              ) : null}
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
                    {storeLocality ? (
                      <Text style={{ fontSize: micro, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                        📍 {storeLocality}
                      </Text>
                    ) : null}
                    <View className="mt-1 flex-row items-center">
                      <View
                        className="mr-2 rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          backgroundColor: colors.SUCCESS,
                        }}
                      />
                      <Text style={{ fontSize: label, color: colors.WHITE }}>
                        {isLive ? 'Store is Live' : store?.storeStatus ?? 'Pending'}
                        {storeHours ? `  ·  ${storeHours}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* SUBSCRIPTION DISABLED - enable in future
        <View className="mt-4 flex-row items-center justify-between">
          <View>
            <Text
              className="font-semibold uppercase tracking-wider"
              style={{ fontSize: micro, color: colors.GOLD }}
            >
              {planTierLabel}
            </Text>
            <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>{planSubtitle}</Text>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(app)/storefront',
                params: {
                  returnTo:
                    returnTo === RETURN_TO_PROFILE
                      ? RETURN_TO_MY_LIVE_STORE_FROM_PROFILE
                      : RETURN_TO_MY_LIVE_STORE,
                },
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
        */}
        <View className="mt-4 flex-row justify-end">
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(app)/storefront',
                params: {
                  returnTo:
                    returnTo === RETURN_TO_PROFILE
                      ? RETURN_TO_MY_LIVE_STORE_FROM_PROFILE
                      : RETURN_TO_MY_LIVE_STORE,
                },
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
