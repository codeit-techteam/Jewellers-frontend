import { colors } from '@constants/colors';
import { getOverview, getProductAnalytics } from '@services/analyticsService';
import { getProducts } from '@services/inventoryService';
import type { AnalyticsRange } from '@/types/analytics';
import { formatInr } from '@utils/formatCurrency';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { usePullToRefresh } from '@hooks/usePullToRefresh';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PERIODS: { label: string; range: AnalyticsRange }[] = [
  { label: 'Today', range: 'today' },
  { label: 'Last 7 Days', range: '7days' },
  { label: 'Last 30 Days', range: '30days' },
  { label: 'This Month', range: 'this_month' },
];

type MetricRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
  body: number;
  micro: number;
  isLast?: boolean;
};

function MetricRow({ icon, iconBg, iconColor, label, value, body, micro, isLast }: MetricRowProps) {
  return (
    <View
      className="flex-row items-center py-3"
      style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.BORDER }}
    >
      <View
        className="mr-3 items-center justify-center rounded-xl"
        style={{ width: 40, height: 40, backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text className="flex-1" style={{ fontSize: body, color: colors.BODY_TEXT }}>
        {label}
      </Text>
      <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
        {value}
      </Text>
    </View>
  );
}

export default function SalesReportScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const currentRange = PERIODS[selectedPeriodIdx].range;

  // Period-scoped overview (re-fetches when period changes)
  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview', currentRange],
    queryFn: () => getOverview(currentRange),
  });

  const productAnalyticsQuery = useQuery({
    queryKey: ['analytics', 'products', currentRange],
    queryFn: () => getProductAnalytics(currentRange),
  });

  const activeProductsQuery = useQuery({
    queryKey: ['products', 'active', 'analytics'],
    queryFn: () => getProducts({ status: 'active', is_draft: false }),
  });

  const overview = overviewQuery.data;
  const overviewLoading = overviewQuery.isPending || overviewQuery.isFetching;
  const overviewError = overviewQuery.isError;
  const productRows = productAnalyticsQuery.data ?? [];
  const productsLoading = productAnalyticsQuery.isPending || productAnalyticsQuery.isFetching;
  const activeProducts = activeProductsQuery.data ?? [];

  const { isRefreshing, onRefresh } = usePullToRefresh([
    overviewQuery,
    productAnalyticsQuery,
    activeProductsQuery,
  ]);

  const topProducts = productRows.slice(0, 8);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View className="flex-row items-center px-5 pb-3">
        <Pressable
          onPress={() => navigateBack(router, returnTo)}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          Store Analytics
        </Text>
      </View>

      {/* ── Period filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
          flexDirection: 'row',
          alignItems: 'center',
          paddingBottom: 12,
        }}
      >
        {PERIODS.map((p, i) => {
          const active = i === selectedPeriodIdx;
          return (
            <Pressable
              key={p.range}
              onPress={() => setSelectedPeriodIdx(i)}
              style={{
                backgroundColor: active ? colors.NAVY : colors.WHITE,
                borderWidth: 1,
                borderColor: active ? colors.NAVY : colors.BORDER,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: label,
                  color: active ? colors.WHITE : colors.BODY_TEXT,
                  fontWeight: active ? '600' : '400',
                }}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.NAVY} />
        }
      >
        {/* ── Overview metrics ── */}
        <Text className="mb-3 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          {PERIODS[selectedPeriodIdx].label}
        </Text>

        {overviewError ? (
          <View
            className="mb-4 rounded-xl p-4"
            style={{
              backgroundColor: `${colors.ERROR}11`,
              borderWidth: 1,
              borderColor: `${colors.ERROR}33`,
            }}
          >
            <Text style={{ fontSize: label, color: colors.ERROR }}>
              Could not load analytics. Pull down to refresh.
            </Text>
          </View>
        ) : overviewLoading ? (
          <ActivityIndicator color={colors.NAVY} style={{ marginVertical: 16 }} />
        ) : (
          <View
            className="mb-5 rounded-xl border"
            style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <MetricRow
              icon="eye-outline"
              iconBg={colors.INFO_BG}
              iconColor={colors.NAVY}
              label="Product Views"
              value={overview?.views ?? 0}
              body={body}
              micro={micro}
            />
            <MetricRow
              icon="chatbubble-outline"
              iconBg={colors.INFO_BG}
              iconColor={colors.NAVY}
              label="Enquiries / Leads"
              value={overview?.inquiry ?? 0}
              body={body}
              micro={micro}
            />
            <MetricRow
              icon="logo-whatsapp"
              iconBg="#DCFCE7"
              iconColor="#16A34A"
              label="WhatsApp Clicks"
              value={overview?.waClicks ?? 0}
              body={body}
              micro={micro}
            />
            <MetricRow
              icon="calendar-outline"
              iconBg={colors.INFO_BG}
              iconColor={colors.NAVY}
              label="Appointments Booked"
              value={overview?.appointments ?? 0}
              body={body}
              micro={micro}
            />
            <MetricRow
              icon="diamond-outline"
              iconBg={colors.SURFACE_MUTED}
              iconColor={colors.NAVY}
              label="Active Products"
              value={activeProducts.length}
              body={body}
              micro={micro}
              isLast
            />
          </View>
        )}

        {/* ── Top products by views ── */}
        <Text className="mb-3 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          Most Viewed Products
        </Text>

        {productsLoading ? (
          <ActivityIndicator color={colors.NAVY} style={{ marginVertical: 8 }} />
        ) : topProducts.length === 0 ? (
          <View
            className="mb-5 items-center rounded-xl border py-10"
            style={{ borderColor: colors.BORDER }}
          >
            <Ionicons name="diamond-outline" size={40} color={colors.BODY_TEXT} />
            <Text className="mt-2" style={{ fontSize: label, color: colors.BODY_TEXT }}>
              No product views yet
            </Text>
            <Text className="mt-1 text-center px-8" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              Product view data will appear here once customers start browsing.
            </Text>
          </View>
        ) : (
          <View className="mb-5">
            {topProducts.map((item, i) => (
              <Pressable
                key={item.productId}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/product-detail',
                    params: { productId: item.productId },
                  })
                }
                className="mb-2 flex-row items-center rounded-xl border p-3"
                style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
              >
                {/* Rank badge */}
                <View
                  className="mr-3 items-center justify-center rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor:
                      i === 0 ? colors.GOLD : i === 1 ? '#C0C0C0' : colors.SURFACE_MUTED,
                  }}
                >
                  <Text
                    className="font-bold"
                    style={{ fontSize: label, color: i < 2 ? colors.WHITE : colors.NAVY }}
                  >
                    {i + 1}
                  </Text>
                </View>

                {/* Product info */}
                <View className="flex-1 pr-2">
                  <Text
                    className="font-semibold"
                    style={{ fontSize: body, color: colors.NAVY }}
                    numberOfLines={1}
                  >
                    {item.productName}
                  </Text>
                  <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                    {formatInr(item.price)}
                  </Text>
                </View>

                {/* Stats + chevron */}
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <View className="items-end" style={{ gap: 3 }}>
                    <View className="flex-row items-center">
                      <Ionicons name="eye-outline" size={12} color={colors.BODY_TEXT} />
                      <Text
                        className="ml-1 font-semibold"
                        style={{ fontSize: label, color: colors.NAVY }}
                      >
                        {item.views}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="chatbubble-outline" size={11} color={colors.BODY_TEXT} />
                      <Text className="ml-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                        {item.inquiry} enq
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.BODY_TEXT} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
