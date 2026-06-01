import { DashboardMetricCard } from '@components/dashboard/DashboardMetricCard';
import { MostViewedProductCard } from '@components/dashboard/MostViewedProductCard';
import { DiamondIcon } from '@components/ui/DiamondIcon';
import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { colors } from '@constants/colors';
import { getResumeRoute } from '@lib/getResumeRoute';
import { getOverview, getProductAnalytics } from '@services/analyticsService';
import { getProducts } from '@services/inventoryService';
import { getNotifications } from '@services/notificationsService';
import { getStore } from '@services/storeService';
import type { AnalyticsRange } from '@/types/analytics';
import type { InventoryProduct } from '@/types/inventory';
import { handleApiError } from '@utils/handleApiError';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { useInventoryStore } from '@store/useInventoryStore';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { RETURN_TO_HOME } from '@lib/navigateBack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DateRangeKey = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7days', label: 'Last 7 Days' },
  { key: '30days', label: 'Last 30 Days' },
  { key: 'custom', label: 'Custom Range' },
];

const RANGE_LABELS: Record<DateRangeKey, string> = {
  today: 'TODAY',
  yesterday: 'YESTERDAY',
  '7days': 'LAST 7 DAYS',
  '30days': 'LAST 30 DAYS',
  custom: 'CUSTOM RANGE',
};

function toApiRange(key: DateRangeKey): AnalyticsRange {
  if (key === 'custom') return '30days';
  return key;
}

const QUICK_ACTIONS = [
  {
    id: 'add',
    icon: 'add-circle-outline' as const,
    title: 'Add Product',
    subtitle: 'List a new piece in your catalogue',
    onPress: 'add' as const,
  },
  {
    id: 'inventory',
    icon: 'grid-outline' as const,
    title: 'Manage Inventory',
    subtitle: 'Edit, sort, and organise products',
    onPress: 'inventory' as const,
  },
  {
    id: 'leads',
    icon: 'people-outline' as const,
    title: 'View Leads',
    subtitle: 'Appointments and customer requests',
    onPress: 'leads' as const,
  },
  {
    id: 'profile',
    icon: 'storefront-outline' as const,
    title: 'Update Boutique',
    subtitle: 'Profile, branding, and documents',
    onPress: 'profile' as const,
  },
] as const;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const setListPrefs = useInventoryStore((s) => s.setListPrefs);

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  const isOnboardingComplete = useOnboardingStore((state) => state.isOnboardingComplete);
  const currentOnboardingStep = useOnboardingStore((state) => state.currentOnboardingStep);
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>('today');
  const apiRange = toApiRange(selectedRange);

  const storeQuery = useQuery({
    queryKey: ['store'],
    queryFn: getStore,
  });

  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview', apiRange],
    queryFn: () => getOverview(apiRange),
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'catalogue'],
    queryFn: () => getProducts(),
  });

  const productAnalyticsQuery = useQuery({
    queryKey: ['analytics', 'products', apiRange],
    queryFn: () => getProductAnalytics(apiRange),
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  });

  const store = storeQuery.data;
  const overview = overviewQuery.data;
  const allProducts = productsQuery.data ?? [];
  const notificationsMeta = notificationsQuery.data;
  const overviewLoading = overviewQuery.isPending || overviewQuery.isFetching;

  const isDashboardLoading =
    (storeQuery.isPending && !store) || (overviewQuery.isPending && !overview);
  const dashboardError = storeQuery.error ?? overviewQuery.error;
  const showDashboardError =
    (storeQuery.isError || overviewQuery.isError) && !store && !overview;

  const refetchDashboard = () => {
    void storeQuery.refetch();
    void overviewQuery.refetch();
    void productsQuery.refetch();
    void productAnalyticsQuery.refetch();
    void notificationsQuery.refetch();
  };

  const storeName = store?.businessName ?? 'Your Store';
  const logoUri = store?.logoUrl ?? null;
  const unreadCount = notificationsMeta?.unreadCount ?? 0;

  const storeViews = overview?.storeViews ?? 0;
  const productViews = overview?.productViews ?? 0;
  const uniqueVisitors = overview?.uniqueVisitors ?? 0;
  const appointments = overview?.appointments ?? 0;

  const [dateRangeLabel, setDateRangeLabel] = useState(RANGE_LABELS.today);
  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [customFrom, setCustomFrom] = useState(dayjs().subtract(6, 'day').toDate());
  const [customTo, setCustomTo] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);

  const productById = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts],
  );

  const mostViewedProducts = useMemo(() => {
    const rows = productAnalyticsQuery.data ?? [];
    const merged: InventoryProduct[] = [];
    for (const row of rows) {
      if (row.views <= 0) continue;
      const product = productById.get(row.productId);
      if (product && !product.isDraft) {
        merged.push({
          ...product,
          analytics: {
            ...product.analytics,
            views: row.views,
            wishlist: row.wishlist,
            inquiry: row.inquiry,
            waClicks: row.waClicks,
          },
        });
      }
      if (merged.length >= 5) break;
    }
    return merged;
  }, [productAnalyticsQuery.data, productById, apiRange]);

  useEffect(() => {
    if (!isOnboardingComplete) {
      router.replace(getResumeRoute(false, currentOnboardingStep));
    }
  }, [isOnboardingComplete, currentOnboardingStep, router]);

  const applyRange = (key: DateRangeKey) => {
    setSelectedRange(key);
    if (key === 'custom') {
      setDateRangeLabel(
        `${dayjs(customFrom).format('D MMM')} - ${dayjs(customTo).format('D MMM')}`,
      );
    } else {
      setDateRangeLabel(RANGE_LABELS[key]);
    }
    setRangeModalVisible(false);
    setPickerTarget(null);
  };

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]['onPress']) => {
    switch (action) {
      case 'add':
        router.push({ pathname: '/(app)/inventory/add', params: { returnTo: RETURN_TO_HOME } });
        break;
      case 'inventory':
        setListPrefs({ sortBy: 'recent', statusFilter: 'all', featuredOnly: false, recentlyAddedOnly: false });
        router.push('/(app)/inventory');
        break;
      case 'leads':
        router.push('/(app)/leads');
        break;
      case 'profile':
        router.push('/(app)/business-profile');
        break;
    }
  };

  const handleViewAllProducts = () => {
    setListPrefs({ sortBy: 'views_desc', statusFilter: 'all', featuredOnly: false, recentlyAddedOnly: false });
    router.push('/(app)/inventory');
  };

  const handlePickerChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setPickerTarget(null);
    }
    if (!date || !pickerTarget) {
      return;
    }
    if (pickerTarget === 'from') {
      setCustomFrom(date);
    } else {
      setCustomTo(date);
    }
    if (selectedRange === 'custom') {
      const from = pickerTarget === 'from' ? date : customFrom;
      const to = pickerTarget === 'to' ? date : customTo;
      setDateRangeLabel(`${dayjs(from).format('D MMM')} - ${dayjs(to).format('D MMM')}`);
    }
  };

  if (isOnboardingComplete && showDashboardError) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <ErrorScreen message={handleApiError(dashboardError)} onRetry={refetchDashboard} />
      </View>
    );
  }

  if (isOnboardingComplete && isDashboardLoading) {
    return <LoadingScreen message="Loading dashboard…" />;
  }

  const productCardWidth = width * 0.42;
  const METRIC_CARD_GAP = 5;
  const metricCardWidth = (width - 32 - METRIC_CARD_GAP) / 2;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.CREAM_LIGHT }}>
      <StatusBar style="dark" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 88,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="mb-4 flex-row items-center justify-between rounded-2xl px-4 py-3"
          style={{ backgroundColor: colors.NAVY }}
        >
          <View className="flex-row flex-1 items-center">
            <View
              className="items-center justify-center overflow-hidden rounded-full border-2"
              style={{
                width: 44,
                height: 44,
                borderColor: colors.GOLD,
                backgroundColor: colors.SURFACE_MUTED,
              }}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={{ width: 44, height: 44 }} resizeMode="cover" />
              ) : (
                <DiamondIcon size={20} containerSize={40} containerColor={colors.NAVY} color={colors.GOLD} />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text style={{ fontSize: micro, color: 'rgba(255,255,255,0.7)' }}>Welcome back</Text>
              <Text className="font-bold" style={{ fontSize: h2 * 0.95, color: colors.WHITE }} numberOfLines={1}>
                {storeName}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/notifications')}
            className="relative h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.WHITE} />
            {unreadCount > 0 ? (
              <View
                className="absolute right-1 top-1 rounded-full"
                style={{ width: 8, height: 8, backgroundColor: colors.ERROR }}
              />
            ) : null}
          </Pressable>
        </View>

        {/* Metrics */}
        <View className="mb-2 flex-row items-center justify-between">
          <View>
            <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
              Business Overview
            </Text>
            <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              Performance for selected period
            </Text>
          </View>
          <Pressable
            onPress={() => setRangeModalVisible(true)}
            className="flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: colors.WHITE, borderWidth: 1, borderColor: colors.BORDER }}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.NAVY} />
            <Text className="ml-1 font-semibold" style={{ fontSize: micro, color: colors.NAVY }}>
              {dateRangeLabel}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: METRIC_CARD_GAP }}>
          <DashboardMetricCard
            icon="storefront-outline"
            label="Store Views"
            hint="Boutique profile visits"
            value={storeViews}
            loading={overviewLoading}
            width={width}
            cardWidth={metricCardWidth}
            h1={h1}
            micro={micro}
          />
          <DashboardMetricCard
            icon="diamond-outline"
            label="Product Views"
            hint="Product detail opens"
            value={productViews}
            loading={overviewLoading}
            width={width}
            cardWidth={metricCardWidth}
            h1={h1}
            micro={micro}
          />
          <DashboardMetricCard
            icon="people-outline"
            label="Unique Visitors"
            hint="Distinct shoppers"
            value={uniqueVisitors}
            loading={overviewLoading}
            accent={colors.GOLD}
            width={width}
            cardWidth={metricCardWidth}
            h1={h1}
            micro={micro}
          />
          <DashboardMetricCard
            icon="calendar-outline"
            label="Appointments"
            hint="Booking requests"
            value={appointments}
            loading={overviewLoading}
            width={width}
            cardWidth={metricCardWidth}
            h1={h1}
            micro={micro}
          />
        </View>

        {/* Most viewed */}
        <View className="mt-5 flex-row items-center justify-between">
          <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
            Most Viewed Products
          </Text>
          <Pressable onPress={handleViewAllProducts} hitSlop={8}>
            <Text className="font-semibold" style={{ fontSize: label, color: colors.GOLD }}>
              View All
            </Text>
          </Pressable>
        </View>

        {productAnalyticsQuery.isFetching && mostViewedProducts.length === 0 ? (
          <View className="items-center py-6">
            <ActivityIndicator color={colors.NAVY} />
          </View>
        ) : mostViewedProducts.length === 0 ? (
          <View
            className="mt-3 items-center rounded-2xl border px-4 py-8"
            style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <Ionicons name="diamond-outline" size={36} color={colors.BODY_TEXT} />
            <Text className="mt-2 text-center" style={{ fontSize: body, color: colors.BODY_TEXT }}>
              Add products to start tracking views
            </Text>
            <Pressable
              onPress={() => handleQuickAction('add')}
              className="mt-3 rounded-full px-4 py-2"
              style={{ backgroundColor: colors.NAVY }}
            >
              <Text style={{ fontSize: label, color: colors.WHITE, fontWeight: '600' }}>
                Add Product
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {mostViewedProducts.map((product) => (
              <MostViewedProductCard
                key={product.id}
                product={product}
                cardWidth={productCardWidth}
                body={body}
                micro={micro}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/product-detail',
                    params: { productId: product.id, returnTo: RETURN_TO_HOME },
                  })
                }
              />
            ))}
          </ScrollView>
        )}

        {/* Quick actions */}
        <Text className="mb-3 mt-5 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handleQuickAction(action.onPress)}
              className="mb-3 rounded-2xl border p-3.5"
              style={{
                width: '48%',
                borderColor: colors.BORDER,
                backgroundColor: colors.WHITE,
              }}
            >
              <View
                className="mb-2 h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.INFO_BG }}
              >
                <Ionicons name={action.icon} size={20} color={colors.NAVY} />
              </View>
              <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                {action.title}
              </Text>
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT, marginTop: 2 }} numberOfLines={2}>
                {action.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={rangeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRangeModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: colors.OVERLAY_DARK }}
          onPress={() => setRangeModalVisible(false)}
        >
          <Pressable
            className="rounded-t-2xl bg-white px-5 pb-8 pt-4"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="mb-3 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
              Select Date Range
            </Text>
            {RANGE_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => {
                  if (option.key === 'custom') {
                    setSelectedRange('custom');
                  } else {
                    applyRange(option.key);
                  }
                }}
                className="border-b py-3"
                style={{ borderColor: colors.BORDER }}
              >
                <Text style={{ fontSize: body, color: colors.NAVY }}>{option.label}</Text>
              </Pressable>
            ))}

            {selectedRange === 'custom' ? (
              <View className="mt-4">
                <Text className="mb-2 font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
                  From
                </Text>
                <Pressable
                  onPress={() => setPickerTarget('from')}
                  className="mb-3 rounded-xl border px-4 py-3"
                  style={{ borderColor: colors.BORDER }}
                >
                  <Text style={{ fontSize: body, color: colors.NAVY }}>
                    {dayjs(customFrom).format('D MMM YYYY')}
                  </Text>
                </Pressable>
                <Text className="mb-2 font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
                  To
                </Text>
                <Pressable
                  onPress={() => setPickerTarget('to')}
                  className="mb-3 rounded-xl border px-4 py-3"
                  style={{ borderColor: colors.BORDER }}
                >
                  <Text style={{ fontSize: body, color: colors.NAVY }}>
                    {dayjs(customTo).format('D MMM YYYY')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => applyRange('custom')}
                  className="items-center rounded-xl py-3"
                  style={{ backgroundColor: colors.NAVY }}
                >
                  <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
                    Apply Custom Range
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {pickerTarget ? (
        <DateTimePicker
          value={pickerTarget === 'from' ? customFrom : customTo}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      ) : null}
    </View>
  );
}
