import { colors } from '@constants/colors';
import { MIN_PRODUCTS_REQUIRED, REVIEW_TIMELINE_STEPS } from '@constants/products';
import { useFontScale } from '@hooks/useFontScale';
import { saveOnboardingMeta } from '@lib/onboardingMeta';
import { getStatus, submitForReview } from '@services/onboardingService';
import { getNotifications } from '@services/notificationsService';
import { useAuthStore } from '@store/useAuthStore';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { handleApiError } from '@utils/handleApiError';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POLL_INTERVAL_MS = 15000;

type ScreenState = 'review' | 'rejected';
type TimelineStepStatus = 'completed' | 'in_progress' | 'locked';

type TimelineStepProps = {
  title: string;
  subtitle: string;
  status: TimelineStepStatus;
  isLast?: boolean;
  iconSize: number;
};

function TimelineStep({
  title,
  subtitle,
  status,
  isLast = false,
  iconSize,
}: TimelineStepProps) {
  const { body, micro } = useFontScale();

  const circleColor =
    status === 'completed'
      ? colors.SUCCESS
      : status === 'in_progress'
        ? colors.NAVY
        : colors.SURFACE_MUTED;

  const iconName =
    status === 'completed'
      ? 'checkmark'
      : status === 'in_progress'
        ? 'hourglass-outline'
        : 'lock-closed';

  const titleColor = status === 'locked' ? colors.BODY_TEXT : colors.NAVY;

  return (
    <View className="flex-row">
      <View className="items-center" style={{ width: iconSize + 8 }}>
        <View
          className="items-center justify-center rounded-full"
          style={{ width: iconSize, height: iconSize, backgroundColor: circleColor }}
        >
          <Ionicons
            name={iconName}
            size={iconSize * 0.45}
            color={status === 'locked' ? colors.BODY_TEXT : colors.WHITE}
          />
        </View>
        {!isLast ? (
          <View
            className="flex-1"
            style={{ width: 2, minHeight: 36, backgroundColor: colors.BORDER, marginVertical: 4 }}
          />
        ) : null}
      </View>
      <View className="flex-1 pb-5 pl-3">
        <Text className="font-bold" style={{ fontSize: body, color: titleColor }}>
          {title}
        </Text>
        <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function ReviewPendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, h1, body, micro, button } = useFontScale();

  const products = useOnboardingStore((state) => state.products);
  const setStoreStatus = useOnboardingStore((state) => state.setStoreStatus);
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);

  const productCount = products.length;

  const [screenState, setScreenState] = useState<ScreenState>('review');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStoppedRef = useRef(false);

  // Block all back navigation — user must wait for review or take an action
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, []),
  );

  const stopPolling = useCallback(() => {
    isStoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchRejectionReason = useCallback(async () => {
    try {
      const { notifications } = await getNotifications('approval');
      if (notifications.length > 0) {
        setRejectionReason(notifications[0].body);
      }
    } catch {
      // Leave reason as null — UI still shows the rejection state
    }
  }, []);

  const startPolling = useCallback(() => {
    isStoppedRef.current = false;

    const doPoll = async () => {
      if (isStoppedRef.current) return;
      try {
        const response = await getStatus();
        if (isStoppedRef.current) return;

        if (response.storeStatus === 'approved') {
          stopPolling();
          setStoreStatus('approved');
          completeOnboarding();
          useAuthStore.setState({ isOnboardingComplete: true });
          await saveOnboardingMeta({
            currentOnboardingStep: 7,
            isOnboardingComplete: true,
            storeStatus: 'approved',
          });
          router.replace('/(onboarding)/store-live');
        } else if (response.storeStatus === 'rejected') {
          stopPolling();
          setStoreStatus('rejected');
          await fetchRejectionReason();
          if (!isStoppedRef.current) setScreenState('rejected');
        }
      } catch {
        // Transient error — keep polling
      }
    };

    void doPoll();
    intervalRef.current = setInterval(() => void doPoll(), POLL_INTERVAL_MS);
  }, [stopPolling, fetchRejectionReason, setStoreStatus, completeOnboarding, router]);

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling]);

  const handleResubmit = async () => {
    setResubmitError(null);
    setIsResubmitting(true);
    try {
      const result = await submitForReview();
      if (result.submitted) {
        setStoreStatus('review');
        setRejectionReason(null);
        setScreenState('review');
        stopPolling();
        startPolling();
      } else {
        const needed = (result.required ?? 5) - (result.productsCount ?? 0);
        setResubmitError(
          `Add ${needed} more product${needed === 1 ? '' : 's'} before resubmitting.`,
        );
      }
    } catch (err) {
      setResubmitError(handleApiError(err));
    } finally {
      setIsResubmitting(false);
    }
  };

  // ─── Rejection UI ────────────────────────────────────────────────────────────

  if (screenState === 'rejected') {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 12 }}>
        <StatusBar style="dark" />
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Red X banner */}
          <View
            className="items-center justify-center overflow-hidden rounded-xl"
            style={{ height: 200, backgroundColor: '#FEF2F2' }}
          >
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 96, height: 96, backgroundColor: '#FEE2E2' }}
            >
              <Ionicons name="close-circle" size={64} color={colors.ERROR} />
            </View>
          </View>

          {/* Heading */}
          <Text
            className="mt-6 text-center font-bold"
            style={{ fontSize: h1, color: colors.NAVY }}
          >
            Store Not Approved
          </Text>
          <Text
            className="mt-2 text-center leading-relaxed"
            style={{ fontSize: body, color: colors.BODY_TEXT }}
          >
            Your store did not pass the admin review. Please read the feedback below and
            resubmit once you&apos;ve made the necessary updates.
          </Text>

          {/* Reason card */}
          <View
            className="mt-5 rounded-xl p-4"
            style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}
          >
            <Text
              className="mb-1 font-semibold"
              style={{ fontSize: micro, color: colors.BODY_TEXT }}
            >
              Admin Feedback:
            </Text>
            <Text style={{ fontSize: body, color: colors.NAVY, lineHeight: body * 1.55 }}>
              {rejectionReason ?? 'Your store was not approved. Please check your documents and product listings, then resubmit.'}
            </Text>
          </View>

          {/* Error from resubmit attempt */}
          {resubmitError ? (
            <Text
              className="mt-3 text-center"
              style={{ fontSize: micro, color: colors.ERROR }}
            >
              {resubmitError}
            </Text>
          ) : null}

          {/* Action buttons */}
          <Pressable
            onPress={() => router.push('/(app)/business-documents')}
            className="mt-6 items-center justify-center rounded-xl border py-4"
            style={{ borderColor: colors.NAVY }}
          >
            <Text className="font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
              Update Documents
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void handleResubmit()}
            disabled={isResubmitting}
            className="mt-3 items-center justify-center rounded-xl py-4"
            style={{
              backgroundColor: colors.NAVY,
              opacity: isResubmitting ? 0.7 : 1,
              minHeight: 52,
            }}
          >
            {isResubmitting ? (
              <ActivityIndicator color={colors.WHITE} />
            ) : (
              <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
                Resubmit for Review
              </Text>
            )}
          </Pressable>

          <Text className="mt-5 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            Your store remains hidden until approved.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // ─── Review-pending UI ───────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 12 }}>
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="items-center justify-center overflow-hidden rounded-xl"
          style={{ height: 220, backgroundColor: colors.NAVY }}
        >
          <View
            className="absolute inset-0"
            style={{ backgroundColor: colors.GOLD, opacity: 0.15 }}
          />
          <Ionicons name="shield-checkmark" size={80} color={colors.GOLD} />
        </View>

        <Text
          className="mt-6 text-center font-bold"
          style={{ fontSize: h1, color: colors.NAVY }}
        >
          Your Store is Being Reviewed
        </Text>
        <Text
          className="mt-3 text-center leading-relaxed"
          style={{ fontSize: body, color: colors.BODY_TEXT }}
        >
          Our team is reviewing your business documents, branding, and product listings before
          your jewelry store goes live.
        </Text>

        <View
          className="mt-6 rounded-xl border p-4"
          style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
        >
          {REVIEW_TIMELINE_STEPS.map((step) => (
            <TimelineStep
              key={step.id}
              title={step.title}
              subtitle={step.subtitle}
              status="completed"
              iconSize={width * 0.07}
              isLast={false}
            />
          ))}
          <TimelineStep
            title={`Products Added (${productCount}/${MIN_PRODUCTS_REQUIRED})`}
            subtitle="Inventory minimum met"
            status="completed"
            iconSize={width * 0.07}
          />
          <TimelineStep
            title="Store Approval Pending"
            subtitle="Current stage: Administrative review"
            status="in_progress"
            iconSize={width * 0.07}
          />
          <TimelineStep
            title="Store Going Live After Approval"
            subtitle=""
            status="locked"
            isLast
            iconSize={width * 0.07}
          />
        </View>

        <View
          className="mt-5 flex-row items-center rounded-xl px-4 py-4"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="time-outline" size={width * 0.06} color={colors.NAVY} />
          <View className="ml-3 flex-1">
            <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
              Estimated Review Time
            </Text>
            <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              Usually within 24–48 hours
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row items-center justify-center">
          <Ionicons name="notifications-outline" size={width * 0.045} color={colors.BODY_TEXT} />
          <Text className="ml-2 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            You&apos;ll receive a notification once your store is approved.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(onboarding)/step5-products')}
          className="mt-6 items-center justify-center rounded-xl border py-4"
          style={{ borderColor: colors.NAVY }}
        >
          <Text className="font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
            Edit Products
          </Text>
        </Pressable>

        <Text className="mt-6 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          Your store will remain hidden from customers until approved.
        </Text>
      </ScrollView>
    </View>
  );
}
