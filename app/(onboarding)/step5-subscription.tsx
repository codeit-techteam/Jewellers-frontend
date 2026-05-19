import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { PlanCard } from '@components/subscription/PlanCard';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { ShieldCheckIcon } from '@components/ui/OnboardingIcons';
import { SUBSCRIPTION_PLANS, getPlanById } from '@constants/subscriptionPlans';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { ApiError } from '@services/api';
import { completeFreeOnboarding } from '@services/onboardingService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { PlanId, Step5Data } from '@/types/payment';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
  const insets = useSafeAreaInsets();
  const { h1, body, label, micro } = useFontScale();

  const savedStep5 = useOnboardingStore((state) => state.step5);
  const setStep5Data = useOnboardingStore((state) => state.setStep5Data);
  const setIsSubmitting = useOnboardingStore((state) => state.setIsSubmitting);
  const isSubmitting = useOnboardingStore((state) => state.isSubmitting);

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(
    savedStep5?.planId ?? 'pro',
  );
  const [apiError, setApiError] = useState<string | null>(null);

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

  const handleFreeComplete = async () => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const data = buildStep5Data('free');
      setStep5Data(data);
      await completeFreeOnboarding();
      router.replace('/(app)/dashboard');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to complete registration.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="px-5">
        <OnboardingScreenHeader
          title="Subscription Plans"
          onBack={() => router.back()}
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
              onFreeCurrentPlan={() => void handleFreeComplete()}
              isFreeLoading={isSubmitting && isFreeSelected}
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

        {apiError ? (
          <Text className="mb-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
            {apiError}
          </Text>
        ) : null}

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
