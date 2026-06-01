import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { PlanCard } from '@components/subscription/PlanCard';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { ShieldCheckIcon } from '@components/ui/OnboardingIcons';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { useAsyncAction } from '@hooks/useAsyncAction';
import { chooseSubscription, getStatus } from '@services/onboardingService';
import { handleApiError } from '@utils/handleApiError';
import { getPlans } from '@services/paymentService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { Plan } from '@/types/payment';
import { navigateBack, RETURN_TO_PROFILE } from '@lib/navigateBack';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Step5SubscriptionScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { h1, body, label, micro } = useFontScale();

  const setStep5Data = useOnboardingStore((state) => state.setStep5Data);
  const setOnboardingStep = useOnboardingStore((state) => state.setOnboardingStep);

  const { execute } = useAsyncAction();

  const handleBack = useCallback(() => {
    if (returnTo === RETURN_TO_PROFILE) {
      navigateBack(router, returnTo);
    } else {
      router.replace('/(onboarding)/step4-branding');
    }
  }, [router, returnTo]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const savedPlanId = useOnboardingStore.getState().step5?.planId ?? '';

    async function init() {
      // Guard: if the user already completed subscription (step >= 6), skip straight to products.
      // Skip this redirect when accessed from the profile (manage-subscription context).
      if (returnTo !== RETURN_TO_PROFILE) {
        try {
          const status = await getStatus();
          if (status.onboardingStep >= 6) {
            router.replace('/(onboarding)/step5-products');
            return;
          }
        } catch {
          // Status check failed — continue to show plans so the user isn't stuck.
        }
      }

      try {
        const fetched = await getPlans();
        setPlans(fetched);
        // Restore previously selected plan or default to the second plan (Pro tier)
        const defaultId =
          savedPlanId && fetched.some((p) => p.id === savedPlanId)
            ? savedPlanId
            : fetched[1]?.id ?? fetched[0]?.id ?? '';
        setSelectedPlanId(defaultId);
      } catch (err) {
        setPlansError(handleApiError(err));
      } finally {
        setIsLoadingPlans(false);
      }
    }

    void init();
  }, [router]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const isFreeSelected = (selectedPlan?.monthlyPrice ?? -1) === 0;
  const canUpgrade = !isFreeSelected && Boolean(selectedPlan);

  const handleFreeComplete = async () => {
    if (!selectedPlan) return;
    setApiError(null);
    setIsProcessing(true);
    try {
      const response = await chooseSubscription(selectedPlan.id, 'monthly');
      setStep5Data({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: 0,
        billingCycle: 'monthly',
      });
      // Persist the server-confirmed onboarding step (should be 6) locally
      setOnboardingStep(response.onboardingStep ?? 6);
      router.replace('/(onboarding)/step5-products');
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeNow = async () => {
    if (!selectedPlan || isFreeSelected) return;
    setApiError(null);
    setIsProcessing(true);
    try {
      const response = await chooseSubscription(selectedPlan.id, selectedPlan.billingCycle);
      setStep5Data({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: response.amount ?? selectedPlan.checkoutPrice,
        billingCycle: selectedPlan.billingCycle,
        subscriptionId: response.subscriptionId,
      });
      router.push('/(onboarding)/step6-checkout');
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // SUBSCRIPTION DISABLED - will be enabled in future
  // Redirect away immediately if someone lands here
  useEffect(() => {
    router.replace('/(app)');
  }, [router]);
  return null;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="px-5">
        <OnboardingScreenHeader
          title="Subscription Plans"
          onBack={handleBack}
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
          {isLoadingPlans ? (
            <ActivityIndicator size="large" color={colors.NAVY} style={{ marginVertical: 40 }} />
          ) : plansError ? (
            <Text className="text-center" style={{ fontSize: body, color: colors.ERROR }}>
              {plansError}
            </Text>
          ) : (
            plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlanId === plan.id}
                onSelect={setSelectedPlanId}
                onFreeCurrentPlan={() => void execute(handleFreeComplete)}
                isFreeLoading={isProcessing && isFreeSelected}
              />
            ))
          )}
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
          onPress={() => void execute(handleUpgradeNow)}
          disabled={!canUpgrade || isProcessing || isLoadingPlans}
          isLoading={isProcessing && !isFreeSelected}
        />
      </View>
    </View>
  );
}
