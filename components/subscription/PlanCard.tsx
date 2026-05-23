import { CheckCircleIcon } from '@components/ui/OnboardingIcons';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import type { Plan, PlanId } from '@/types/payment';
import { formatInr } from '@utils/formatCurrency';
import { Pressable, Text, View } from 'react-native';

type PlanCardProps = {
  plan: Plan;
  isSelected: boolean;
  onSelect: (planId: PlanId) => void;
  onFreeCurrentPlan?: () => void;
  isFreeLoading?: boolean;
};

export function PlanCard({
  plan,
  isSelected,
  onSelect,
  onFreeCurrentPlan,
  isFreeLoading = false,
}: PlanCardProps) {
  const { width, h2, body, label, button } = useFontScale();
  // Use price and isBestValue — plan IDs are backend UUIDs, not fixed slugs
  const isFree = plan.monthlyPrice === 0;
  const isPro = plan.isBestValue === true;

  const borderColor = isSelected ? colors.NAVY : colors.BORDER;
  const shadowStyle =
    isSelected && isPro
      ? {
          shadowColor: colors.NAVY,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 4,
        }
      : undefined;

  const renderButton = () => {
    if (isFree) {
      return (
        <Pressable
          onPress={onFreeCurrentPlan}
          disabled={isFreeLoading}
          className="items-center justify-center rounded-xl py-3"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Text className="font-semibold" style={{ fontSize: button, color: colors.BODY_TEXT }}>
            Current Plan
          </Text>
        </Pressable>
      );
    }

    if (isPro) {
      return (
        <Pressable
          onPress={() => onSelect(plan.id)}
          className="items-center justify-center rounded-xl py-3"
          style={{ backgroundColor: colors.NAVY }}
        >
          <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
            Upgrade to Pro
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={() => onSelect(plan.id)}
        className="items-center justify-center rounded-xl border py-3"
        style={{ borderColor: colors.NAVY, backgroundColor: colors.UPLOAD_BG }}
      >
        <Text className="font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
          Choose Featured
        </Text>
      </Pressable>
    );
  };

  return (
    <Pressable
      onPress={() => onSelect(plan.id)}
      className="mb-4 rounded-xl border p-4"
      style={[
        {
          borderColor,
          borderWidth: isSelected ? 2 : 1,
          backgroundColor: colors.WHITE,
        },
        shadowStyle,
      ]}
    >
      {plan.isBestValue ? (
        <View
          className="absolute right-3 top-3 rounded-full px-2 py-1"
          style={{ backgroundColor: colors.NAVY }}
        >
          <Text className="font-bold uppercase" style={{ fontSize: label * 0.85, color: colors.WHITE }}>
            BEST VALUE
          </Text>
        </View>
      ) : null}

      <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
        {plan.name}
      </Text>
      <View className="mt-1 flex-row items-end">
        <Text className="font-bold" style={{ fontSize: h2 * 1.2, color: colors.NAVY }}>
          {formatInr(plan.monthlyPrice)}
        </Text>
        <Text className="mb-1 ml-1" style={{ fontSize: label, color: colors.BODY_TEXT }}>
          /month
        </Text>
      </View>

      <View className="mt-4" style={{ gap: width * 0.02 }}>
        {plan.features.map((feature) => (
          <View key={feature} className="flex-row items-start">
            <CheckCircleIcon size={label * 1.1} />
            <Text className="ml-2 flex-1" style={{ fontSize: body, color: colors.BODY_TEXT }}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-4">{renderButton()}</View>
    </Pressable>
  );
}
