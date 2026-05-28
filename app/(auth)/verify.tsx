import { DiamondIcon } from '@components/ui/DiamondIcon';
import { OtpInput } from '@components/ui/OtpInput';
import { PrimaryButton } from '@components/ui/PrimaryButton';
/* eslint-disable react-hooks/immutability -- Reanimated shared values */
import { colors } from '@constants/colors';
import { config } from '@constants/config';
import { useFontScale } from '@hooks/useFontScale';
import { useAsyncAction } from '@hooks/useAsyncAction';
import { handleApiError } from '@utils/handleApiError';
import { getResumeRoute } from '@lib/getResumeRoute';
import { loadOtpSession } from '@lib/otpSession';
import { resendOtp, verifyOtp } from '@services/authService';
import { useAuthStore } from '@store/useAuthStore';
import { formatPhoneDisplay, formatTimerValue } from '@utils/formatPhone';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OTP_LENGTH = 6;
const TIMER_SECONDS = 45;

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height, h1, h2, body, label, micro } = useFontScale();

  const params = useLocalSearchParams<{ phone?: string; countryCode?: string }>();
  const storePhone = useAuthStore((state) => state.phoneNumber);
  const storeCountryCode = useAuthStore((state) => state.countryCode);
  const setPhoneForOtp = useAuthStore((state) => state.setPhoneForOtp);
  const setAuthSuccess = useAuthStore((state) => state.setAuthSuccess);
  const clearOtpSession = useAuthStore((state) => state.clearOtpSession);

  const [resolvedPhone, setResolvedPhone] = useState<string | null>(
    params.phone ?? storePhone ?? null,
  );
  const [resolvedCountryCode, setResolvedCountryCode] = useState<string | null>(
    params.countryCode ?? storeCountryCode ?? null,
  );
  const [isResolvingSession, setIsResolvingSession] = useState(
    !(params.phone && params.countryCode) && !(storePhone && storeCountryCode),
  );

  const [otp, setOtp] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [resetKey, setResetKey] = useState(0);

  const { execute } = useAsyncAction();

  const shakeX = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate OTP session from route params, Zustand, or SecureStore (survives logout races).
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let phone = params.phone ?? storePhone ?? null;
      let countryCode = params.countryCode ?? storeCountryCode ?? null;

      if (!phone || !countryCode) {
        const persisted = await loadOtpSession();
        phone = phone ?? persisted?.phone ?? null;
        countryCode = countryCode ?? persisted?.countryCode ?? null;
      }

      if (cancelled) return;

      if (phone && countryCode) {
        setResolvedPhone(phone);
        setResolvedCountryCode(countryCode);
        if (!storePhone || !storeCountryCode) {
          setPhoneForOtp(phone, countryCode);
        }
      }
      setIsResolvingSession(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [params.phone, params.countryCode, storePhone, storeCountryCode, setPhoneForOtp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const canResend = secondsLeft === 0;

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeX]);

  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setSecondsLeft(TIMER_SECONDS);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setOtp('');
    setApiError(null);
    setHasError(false);
    setResetKey((k) => k + 1);
    clearOtpSession();
    router.back();
  };

  const handleVerify = async (code: string) => {
    if (!resolvedPhone || code.length !== OTP_LENGTH) {
      return;
    }
    setApiError(null);
    setHasError(false);
    setIsVerifying(true);
    try {
      const response = await verifyOtp(resolvedPhone, code);
      const resumeRoute = getResumeRoute(
        response.isOnboardingComplete,
        response.onboardingStep,
        response.storeStatus ?? undefined,
        response.needsSubscription,
      );

      // Navigate immediately — setAuthSuccess updates in-memory session first.
      void setAuthSuccess(
        response.token,
        response.user,
        response.onboardingStep,
        response.isOnboardingComplete,
        response.storeStatus ?? null,
        response.needsSubscription,
      );
      router.replace(resumeRoute);
    } catch (error) {
      setApiError(handleApiError(error));
      setHasError(true);
      triggerShake();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!resolvedPhone || !canResend || isResending) {
      return;
    }
    setApiError(null);
    setHasError(false);
    setIsResending(true);
    try {
      await resendOtp(resolvedPhone);
      setOtp('');
      setResetKey((k) => k + 1);
      startTimer();
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsResending(false);
    }
  };

  if (isResolvingSession) {
    return null;
  }

  if (!resolvedPhone || !resolvedCountryCode) {
    return <Redirect href="/(auth)/login" />;
  }

  const displayPhone = formatPhoneDisplay(resolvedCountryCode, resolvedPhone);
  const isOtpComplete = otp.length === OTP_LENGTH;

  return (
    <View
      className="flex-1 bg-white px-6"
      style={{
        paddingTop: insets.top + height * 0.01,
        paddingBottom: insets.bottom + height * 0.02,
      }}
    >
      <StatusBar style="dark" />

      <Pressable
        onPress={handleBack}
        className="mb-4 h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.CREAM }}
      >
        <Text style={{ fontSize: h2, color: colors.NAVY }}>‹</Text>
      </Pressable>

      <View className="flex-1 justify-between">
        <View className="items-center">
          <DiamondIcon containerSize={width * 0.12} size={width * 0.045} />
          <Text className="mt-5 font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
            Verification
          </Text>
          <Text
            className="mt-3 text-center leading-relaxed"
            style={{ fontSize: body, color: colors.BODY_TEXT, maxWidth: width * 0.85 }}
          >
            We&apos;ve sent a 6-digit secure code to your registered mobile number
          </Text>
          <Text className="mt-2 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
            {displayPhone}
          </Text>
          <Pressable className="mt-2 flex-row items-center" onPress={() => router.back()}>
            <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>✎ </Text>
            <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>Change Number</Text>
          </Pressable>

          {config.isDev && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(201,168,76,0.12)',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginTop: 16,
                gap: 6,
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.35)',
              }}
            >
              <Text style={{ fontSize: label, color: '#92700A' }}>
                🛠 Dev — mock OTP:{' '}
                <Text style={{ fontWeight: '700', letterSpacing: 2, color: '#92700A' }}>
                  123456
                </Text>
              </Text>
            </View>
          )}

          <Animated.View style={shakeStyle} className="mt-8 w-full">
            <OtpInput
              key={`otp-${resetKey}`}
              length={OTP_LENGTH}
              hasError={hasError}
              onChangeOtp={setOtp}
              onComplete={() => undefined}
            />
          </Animated.View>

          {apiError ? (
            <Text className="mt-3 text-center" style={{ fontSize: label, color: colors.ERROR }}>
              {apiError}
            </Text>
          ) : null}

          <View className="mt-8 flex-row items-center justify-center">
            <View
              className="items-center rounded-2xl px-5 py-3"
              style={{ backgroundColor: colors.CREAM, minWidth: width * 0.28 }}
            >
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>MINUTES</Text>
              <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
                {formatTimerValue(minutes)}
              </Text>
            </View>
            <Text className="mx-2 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
              :
            </Text>
            <View
              className="items-center rounded-2xl px-5 py-3"
              style={{ backgroundColor: colors.CREAM, minWidth: width * 0.28 }}
            >
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>SECONDS</Text>
              <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
                {formatTimerValue(seconds)}
              </Text>
            </View>
          </View>

          <Text className="mt-5 text-center" style={{ fontSize: body, color: colors.BODY_TEXT }}>
            Didn&apos;t receive the code?{' '}
            <Text
              onPress={canResend && !isResending ? handleResend : undefined}
              style={{
                fontSize: body,
                color: canResend ? colors.NAVY : colors.BODY_TEXT,
                fontWeight: canResend ? '700' : '400',
              }}
            >
              Resend OTP
            </Text>
          </Text>
        </View>

        <View>
          <PrimaryButton
            label="Verify & Proceed"
            showArrow
            isLoading={isVerifying}
            disabled={!isOtpComplete || isVerifying}
            onPress={() => void execute(() => handleVerify(otp))}
          />
          <View className="mt-5 flex-row items-center justify-center">
            <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>🔒 </Text>
            <Text className="tracking-wider" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              SECURE END-TO-END ENCRYPTION
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
