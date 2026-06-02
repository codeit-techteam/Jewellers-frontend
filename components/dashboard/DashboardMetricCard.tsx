import { colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { memo, type ComponentProps } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

type DashboardMetricCardProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  value: number | string;
  loading?: boolean;
  accent?: string;
  width: number;
  cardWidth: number;
  h1: number;
  micro: number;
};

export const DashboardMetricCard = memo(function DashboardMetricCard({
  icon,
  label,
  hint,
  value,
  loading,
  accent = colors.NAVY,
  width,
  cardWidth,
  h1,
  micro,
}: DashboardMetricCardProps) {
  return (
    <View
      className="rounded-2xl border p-3.5"
      style={{
        width: cardWidth,
        borderColor: colors.BORDER,
        backgroundColor: colors.WHITE,
        minHeight: width * 0.28,
      }}
    >
      <View
        className="mb-2 h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: colors.INFO_BG }}
      >
        <Ionicons name={icon} size={width * 0.048} color={accent} />
      </View>
      <Text
        className="uppercase tracking-wide"
        style={{ fontSize: micro, color: colors.BODY_TEXT }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {hint ? (
        <Text style={{ fontSize: micro * 0.92, color: colors.BODY_TEXT, marginTop: 2 }} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
      {loading ? (
        <ActivityIndicator className="mt-2" color={colors.NAVY} size="small" />
      ) : (
        <Text className="mt-1 font-bold" style={{ fontSize: h1 * 0.85, color: colors.NAVY }}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </Text>
      )}
    </View>
  );
});
