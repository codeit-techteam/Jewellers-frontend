import { colors } from '@constants/colors';
import {
  MOCK_SALES_REPORT,
  SALES_REPORT_PERIODS,
  type SalesReportPeriod,
} from '@constants/salesReport';
import { formatInr } from '@utils/formatCurrency';
import { showComingSoonAlert } from '@utils/storeAlerts';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SalesReportScreen() {
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

  const [period, setPeriod] = useState<SalesReportPeriod>('Today');
  const report = MOCK_SALES_REPORT;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

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
          Sales Reports
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="mb-3 self-start rounded-full px-3 py-1"
          style={{ backgroundColor: colors.TIP_BG }}
        >
          <Text className="font-semibold" style={{ fontSize: micro, color: colors.GOLD }}>
            Sample Data
          </Text>
        </View>

        <View style={{ flexGrow: 0, marginBottom: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            nestedScrollEnabled
            contentContainerStyle={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {SALES_REPORT_PERIODS.map((item) => {
              const isActive = item === period;
              return (
                <Pressable
                  key={item}
                  onPress={() => setPeriod(item)}
                  style={{
                    backgroundColor: isActive ? colors.NAVY : colors.WHITE,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: colors.BORDER,
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: label, color: isActive ? colors.WHITE : colors.BODY_TEXT }}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="rounded-xl p-4" style={{ backgroundColor: colors.NAVY }}>
          <Text style={{ fontSize: label, color: `${colors.WHITE}CC` }}>Total Revenue ({period})</Text>
          <Text className="mt-1 font-bold" style={{ fontSize: h1, color: colors.WHITE }}>
            {formatInr(report.totalRevenue)}
          </Text>
          <Text className="mt-1" style={{ fontSize: micro, color: colors.SUCCESS }}>
            {report.growthPercent} vs last period
          </Text>
        </View>

        <View className="mt-4 flex-row flex-wrap justify-between">
          {[
            { label: 'Orders', value: String(report.orders) },
            { label: 'Avg Order', value: formatInr(report.avgOrder) },
            { label: 'Views', value: String(report.views) },
            { label: 'Conversion', value: `${report.conversion}%` },
          ].map((stat) => (
            <View
              key={stat.label}
              className="mb-3 rounded-xl border p-4"
              style={{ width: '48%', borderColor: colors.BORDER }}
            >
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{stat.label}</Text>
              <Text className="mt-1 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        <Text className="mb-3 mt-2 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          Top Products
        </Text>
        {report.topProducts.map((item) => (
          <View
            key={item.rank}
            className="mb-2 flex-row items-center rounded-xl border p-3"
            style={{ borderColor: colors.BORDER }}
          >
            <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY, width: 28 }}>
              {item.rank}
            </Text>
            <Text className="flex-1" style={{ fontSize: body, color: colors.NAVY }}>
              {item.name}
            </Text>
            <Text className="font-bold" style={{ fontSize: label, color: colors.NAVY }}>
              {formatInr(item.revenue)}
            </Text>
          </View>
        ))}

        <Text className="mb-3 mt-4 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          Recent Activity
        </Text>
        {report.recentActivity.map((activity) => (
          <View key={activity.text} className="mb-3 flex-row items-start">
            <View
              className="mr-3 items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                backgroundColor: colors.INFO_BG,
              }}
            >
              <Ionicons name={activity.icon} size={18} color={colors.NAVY} />
            </View>
            <View className="flex-1">
              <Text style={{ fontSize: body, color: colors.NAVY }}>{activity.text}</Text>
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{activity.time}</Text>
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => showComingSoonAlert()}
          className="mt-4 items-center justify-center rounded-xl border py-4"
          style={{ borderColor: colors.NAVY }}
        >
          <Text className="font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
            Export Report
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
