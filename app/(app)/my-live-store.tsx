import { DashboardMetricCard } from '@components/dashboard/DashboardMetricCard';
import { colors } from '@constants/colors';
import { MANAGE_STORE_ACTIONS } from '@constants/storeApp';
import { useRequireOnboardingComplete } from '@hooks/useRequireOnboardingComplete';
import { getOverview, getStoreAnalytics } from '@services/analyticsService';
import { getProducts } from '@services/inventoryService';
import { getStore } from '@services/storeService';
import type { AnalyticsRange } from '@/types/analytics';
import { shareStore } from '@utils/shareUtils';
import { showComingSoonAlert } from '@utils/storeAlerts';
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
import { useState } from 'react';
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

type SnapshotRange = 'today' | 'week' | 'month';

const RANGE_PILLS: { key: SnapshotRange; label: string; apiRange: AnalyticsRange }[] = [
  { key: 'today', label: 'Today', apiRange: 'today' },
  { key: 'week', label: 'This Week', apiRange: '7days' },
  { key: 'month', label: 'This Month', apiRange: '30days' },
];

function toApiRange(selected: SnapshotRange): AnalyticsRange {
  return RANGE_PILLS.find((pill) => pill.key === selected)?.apiRange ?? 'today';
}

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
  const metricCardGap = width * 0.025;
  const metricCardWidth = (width - 40 - metricCardGap) / 2;

  const [selectedRange, setSelectedRange] = useState<SnapshotRange>('today');
  const apiRange = toApiRange(selectedRange);

  const storeQuery = useQuery({
    queryKey: ['store'],
    queryFn: getStore,
  });

  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview', apiRange],
    queryFn: () => getOverview(apiRange),
  });

  const storeAnalyticsQuery = useQuery({
    queryKey: ['analytics', 'store', apiRange],
    queryFn: () => getStoreAnalytics(apiRange),
  });

  const activeProductsQuery = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => getProducts({ status: 'active', is_draft: false }),
  });

  const store = storeQuery.data;
  const overview = overviewQuery.data;
  const storeAnalytics = storeAnalyticsQuery.data;
  const activeProducts = activeProductsQuery.data ?? [];
  const storeLoading = storeQuery.isPending;
  const rangeStatsLoading =
    overviewQuery.isFetching || storeAnalyticsQuery.isFetching;
  const productsLoading = activeProductsQuery.isPending && !activeProductsQuery.data;

  const { isRefreshing: isLiveStoreRefreshing, onRefresh: onLiveStoreRefresh } = usePullToRefresh([
    storeQuery,
    overviewQuery,
    storeAnalyticsQuery,
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

  const storeVisits = storeAnalytics?.boutiqueVisits ?? 0;
  const productViews = overview?.productViews ?? overview?.views ?? 0;
  const leads = overview?.appointments ?? 0;

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
          onPress={() => {
            if (store?.id && storeName) {
              void shareStore(storeName, store.id);
            }
          }}
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
        <View className="mt-3 flex-row" style={{ gap: 8 }}>
          {RANGE_PILLS.map((pill) => {
            const isActive = pill.key === selectedRange;
            return (
              <Pressable
                key={pill.key}
                onPress={() => setSelectedRange(pill.key)}
                className="flex-1 items-center rounded-full py-2"
                style={{
                  backgroundColor: isActive ? colors.NAVY : colors.WHITE,
                  borderWidth: 1,
                  borderColor: isActive ? colors.NAVY : colors.BORDER,
                }}
              >
                <Text
                  className="font-semibold"
                  style={{
                    fontSize: micro,
                    color: isActive ? colors.WHITE : colors.BODY_TEXT,
                  }}
                  numberOfLines={1}
                >
                  {pill.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="mt-3 flex-row flex-wrap" style={{ gap: metricCardGap }}>
          <DashboardMetricCard
            icon="storefront-outline"
            label="Store Visits"
            value={storeVisits}
            loading={rangeStatsLoading}
            width={width}
            cardWidth={metricCardWidth}
            h1={h1}
            micro={micro}
          />
          <DashboardMetricCard
            icon="eye-outline"
            label="Product Views"
            value={productViews}
            loading={rangeStatsLoading}
            width={width}
            cardWidth={metricCardWidth}
            h1={h1}
            micro={micro}
          />
          <DashboardMetricCard
            icon="diamond-outline"
            label="Products"
            value={productCount}
            loading={productsLoading}
            width={width}
            cardWidth={metricCardWidth}
            h1={h1}
            micro={micro}
          />
          <DashboardMetricCard
            icon="calendar-outline"
            label="Leads"
            value={leads}
            loading={rangeStatsLoading}
            width={width}
            cardWidth={metricCardWidth}
            h1={h1}
            micro={micro}
          />
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
