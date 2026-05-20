import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { PlanCard } from '@components/subscription/PlanCard';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { ShieldCheckIcon } from '@components/ui/OnboardingIcons';
import { SUBSCRIPTION_PLANS, getPlanById } from '@constants/subscriptionPlans';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { PlanId, Step5Data } from '@/types/payment';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function buildStep5Data(planId: PlanId): Step5Data {
  const plan = getPlanById(planId);
  return {
    planId: plan.id,
    planName: plan.name,
    price: plan.checkoutPrice,
    billingCycle: plan.billingCycle,
  };
}

export default function Step5SubscriptionScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { h1, body, label, micro } = useFontScale();

  const setStep5Data = useOnboardingStore((state) => state.setStep5Data);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('pro');

  useEffect(() => {
    const saved = useOnboardingStore.getState().step5;
    if (saved?.planId) {
      setSelectedPlanId(saved.planId);
    }
  }, []);

  const isFreeSelected = selectedPlanId === 'free';
  const canUpgrade = !isFreeSelected;

  const handleUpgradeNow = () => {
    if (!canUpgrade) {
      return;
    }
    const data = buildStep5Data(selectedPlanId);
    setStep5Data(data);
    router.push('/(onboarding)/step6-checkout');
  };

  const handleFreeComplete = () => {
    const data = buildStep5Data('free');
    setStep5Data(data);
    router.replace('/(onboarding)/step5-products');
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="px-5">
        <OnboardingScreenHeader
          title="Subscription Plans"
          onBack={() => navigateBack(router, returnTo)}
        />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-center font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          Empower Your Jewelry Business
        </Text>
        <Text
          className="mt-2 text-center"
          style={{ fontSize: body, color: colors.BODY_TEXT }}
        >
          Choose a plan that fits your scale and ambition
        </Text>

        <View className="mt-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              onSelect={setSelectedPlanId}
              onFreeCurrentPlan={handleFreeComplete}
              isFreeLoading={false}
            />
          ))}
        </View>
      </ScrollView>

      <View
        className="border-t px-5 pt-3"
        style={{ borderColor: colors.BORDER, paddingBottom: insets.bottom + 12 }}
      >
        <View
          className="mb-3 rounded-xl border p-3"
          style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
        >
          <View className="flex-row items-center">
            <ShieldCheckIcon color={colors.SUCCESS} />
            <Text className="ml-2 font-bold" style={{ fontSize: label, color: colors.NAVY }}>
              Securely Pay with Razorpay
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <View
              className="rounded px-2 py-1"
              style={{ backgroundColor: colors.INFO_BG }}
            >
              <Text className="font-bold" style={{ fontSize: micro, color: colors.NAVY }}>
                RAZORPAY
              </Text>
            </View>
            <Text
              className="ml-3 flex-1 text-right"
              style={{ fontSize: micro, color: colors.BODY_TEXT }}
            >
              Trusted by 50,000+ businesses. All transactions are encrypted.
            </Text>
          </View>
        </View>

        <PrimaryButton
          label="Upgrade Now"
          showArrow
          onPress={handleUpgradeNow}
          disabled={!canUpgrade}
        />
      </View>
    </View>
  );
}
