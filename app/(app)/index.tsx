import { DiamondIcon } from '@components/ui/DiamondIcon';
import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { colors } from '@constants/colors';
import { getResumeRoute } from '@lib/getResumeRoute';
import { getOverview } from '@services/analyticsService';
import { getProducts } from '@services/inventoryService';
import { getNotifications } from '@services/notificationsService';
import { getStore } from '@services/storeService';
import type { AnalyticsRange } from '@/types/analytics';
import { handleApiError } from '@utils/handleApiError';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { RETURN_TO_HOME } from '@lib/navigateBack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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

function formatRenewalDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = dayjs(iso);
  return d.isValid() ? d.format('MMM D, YYYY') : '—';
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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
    queryKey: ['analytics', apiRange],
    queryFn: () => getOverview(apiRange),
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => getProducts({ status: 'active', is_draft: false }),
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  });

  const store = storeQuery.data;
  const overview = overviewQuery.data;
  const activeProducts = productsQuery.data ?? [];
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
    void notificationsQuery.refetch();
  };

  const storeName = store?.businessName ?? 'Your Store';
  const logoUri = store?.logoUrl ?? null;
  const planName = (store?.planName ?? 'Free Plan').toUpperCase();
  const totalViews = overview?.views ?? 0;
  const totalLeads = overview?.appointments ?? 0;
  const unreadCount = notificationsMeta?.unreadCount ?? 0;
  const planRenewal = formatRenewalDate(store?.planRenewalDate);
  const [dateRangeLabel, setDateRangeLabel] = useState(RANGE_LABELS.today);
  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [customFrom, setCustomFrom] = useState(dayjs().subtract(6, 'day').toDate());
  const [customTo, setCustomTo] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);

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

  if (isOnboardingComplete && showDashboardError) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <ErrorScreen
          message={handleApiError(dashboardError)}
          onRetry={refetchDashboard}
        />
      </View>
    );
  }

  if (isOnboardingComplete && isDashboardLoading) {
    return <LoadingScreen message="Loading dashboard…" />;
  }

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

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-between px-5 pb-3">
        <View className="flex-row items-center">
          <View
            className="items-center justify-center overflow-hidden rounded-full"
            style={{
              width: 40,
              height: 40,
              backgroundColor: colors.SURFACE_MUTED,
            }}
          >
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={{ width: 40, height: 40 }} resizeMode="cover" />
            ) : (
              <DiamondIcon size={18} containerSize={36} containerColor={colors.SURFACE_MUTED} color={colors.GOLD} />
            )}
          </View>
          <View className="ml-3">
            <Text
              className="uppercase tracking-wider"
              style={{ fontSize: micro, color: colors.BODY_TEXT }}
            >
              Welcome back,
            </Text>
            <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
              {storeName}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/(app)/notifications')}
          className="relative h-10 w-10 items-center justify-center"
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.SURFACE_MUTED }}
          >
            <Ionicons name="notifications-outline" size={width * 0.055} color={colors.NAVY} />
          </View>
          {unreadCount > 0 ? (
            <View
              className="absolute right-2 top-2 rounded-full"
              style={{ width: 8, height: 8, backgroundColor: colors.ERROR }}
            />
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
            Business Overview
          </Text>
          <Pressable
            onPress={() => setRangeModalVisible(true)}
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: colors.SURFACE_MUTED }}
          >
            <Text className="font-semibold" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              {dateRangeLabel}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap justify-between">
          <View
            className="mb-3 rounded-xl border p-4"
            style={{ width: '48%', borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <Ionicons name="eye-outline" size={width * 0.055} color={colors.NAVY} />
            <Text className="mt-3 uppercase" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              Total Views
            </Text>
            {overviewLoading ? (
              <ActivityIndicator className="mt-2" color={colors.NAVY} />
            ) : (
              <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
                {totalViews.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          <View
            className="mb-3 rounded-xl border p-4"
            style={{ width: '48%', borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <Ionicons name="chatbubble-outline" size={width * 0.055} color={colors.NAVY} />
            <Text className="mt-3 uppercase" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              Appointments
            </Text>
            {overviewLoading ? (
              <ActivityIndicator className="mt-2" color={colors.NAVY} />
            ) : (
              <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
                {totalLeads.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          <View
            className="mb-3 rounded-xl border p-4"
            style={{ width: '48%', borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <Ionicons name="diamond-outline" size={width * 0.055} color={colors.NAVY} />
            <Text className="mt-3 uppercase" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              Active Products
            </Text>
            <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
              {activeProducts.length}
            </Text>
            <View className="mt-2 flex-row items-center">
              {activeProducts.slice(0, 2).map((product, index) => (
                <View
                  key={product.id}
                  className="items-center justify-center rounded-full border-2 border-white"
                  style={{
                    width: 28,
                    height: 28,
                    marginLeft: index > 0 ? -10 : 0,
                    backgroundColor: colors.INFO_BG,
                  }}
                >
                  {product.imageUri ? (
                    <Image
                      source={{ uri: product.imageUri }}
                      style={{ width: 24, height: 24, borderRadius: 12 }}
                    />
                  ) : (
                    <Text style={{ fontSize: micro, color: colors.NAVY }}>
                      {product.name.charAt(0)}
                    </Text>
                  )}
                </View>
              ))}
              {activeProducts.length > 2 ? (
                <Text className="ml-2" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                  +{activeProducts.length - 2}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            className="mb-3 rounded-xl border p-4"
            style={{ width: '48%', borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <View className="flex-row items-center justify-between">
              <Ionicons name="shield-checkmark" size={width * 0.055} color={colors.NAVY} />
              <View className="rounded-full" style={{ width: 8, height: 8, backgroundColor: colors.SUCCESS }} />
            </View>
            <Text className="mt-3 uppercase" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              {planName}
            </Text>
            <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
              Active
            </Text>
            <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              Renews: {planRenewal}
            </Text>
          </View>
        </View>

        <Text className="mb-3 mt-5 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          Quick Actions
        </Text>

        <Pressable
          onPress={() => router.push({ pathname: '/(app)/inventory/add', params: { returnTo: RETURN_TO_HOME } })}
          className="mb-2 flex-row items-center rounded-xl border p-4"
          style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
        >
          <View
            className="mr-3 items-center justify-center rounded-lg"
            style={{ width: 40, height: 40, backgroundColor: colors.INFO_BG }}
          >
            <Ionicons name="add" size={width * 0.055} color={colors.NAVY} />
          </View>
          <View className="flex-1">
            <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
              Add New Product
            </Text>
            <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>
              Upload photos and set prices
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={width * 0.045} color={colors.BODY_TEXT} />
        </Pressable>

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
