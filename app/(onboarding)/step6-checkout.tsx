import { CalendarIcon, CreditCardIcon, ShieldCheckIcon, WalletIcon } from '@components/ui/OnboardingIcons';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { colors } from '@constants/colors';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFontScale } from '@hooks/useFontScale';
import { handleApiError } from '@utils/handleApiError';
import { mockPayment } from '@services/paymentService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { PaymentMethod } from '@/types/payment';
import { formatInr } from '@utils/formatCurrency';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const cardSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{16}$/, 'Enter a valid 16-digit card number'),
  expiry: z
    .string()
    .min(1, 'Expiry is required')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format')
    .refine((value) => {
      const [month, year] = value.split('/');
      const expMonth = Number(month);
      const expYear = 2000 + Number(year);
      const now = new Date();
      const expDate = new Date(expYear, expMonth, 0);
      return expDate >= new Date(now.getFullYear(), now.getMonth(), 1);
    }, 'Card has expired'),
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^\d{3,4}$/, 'Enter a valid CVV'),
});

type CardFormValues = z.infer<typeof cardSchema>;

function formatExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16);
}

export default function Step6CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, h1, h2, body, label, micro } = useFontScale();

  const step5 = useOnboardingStore((state) => state.step5);
  const setStep6Data = useOnboardingStore((state) => state.setStep6Data);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { cardNumber: '', expiry: '', cvv: '' },
  });

  useEffect(() => {
    if (!paymentSuccess) {
      return;
    }
    const timer = setTimeout(() => {
      router.replace('/(app)');
    }, 1500);
    return () => clearTimeout(timer);
  }, [paymentSuccess, router]);

  if (!step5 || !step5.subscriptionId) {
    return <Redirect href="/(onboarding)/step5-subscription" />;
  }

  const planLabel = `JEWELLER ${step5.planName.toUpperCase()} PLAN`;
  const planDisplayName =
    step5.billingCycle === 'annual'
      ? `${step5.planName} Plan - Annual`
      : `${step5.planName} Plan - Monthly`;
  const validityDays = step5.billingCycle === 'annual' ? 365 : 30;

  const processPayment = async () => {
    setApiError(null);
    setIsPaying(true);
    try {
      const response = await mockPayment(step5.subscriptionId!, paymentMethod);
      setStep6Data({
        paymentMethod,
        status: 'success',
        transactionId: response.transactionId,
      });
      setPaymentSuccess(true);
    } catch (error) {
      setApiError(handleApiError(error));
      setStep6Data({ paymentMethod, status: 'failed' });
    } finally {
      setIsPaying(false);
    }
  };

  const handlePayPress = () => {
    if (paymentMethod === 'card') {
      void handleSubmit(() => {
        void processPayment();
      })();
      return;
    }
    void processPayment();
  };

  if (paymentSuccess) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <StatusBar style="dark" />
        <Text style={{ fontSize: h1 * 1.5, color: colors.SUCCESS }}>✓</Text>
        <Text className="mt-4 font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          Payment Successful
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-white px-5"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}
    >
      <StatusBar style="dark" />

      <View className="mb-4 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Text style={{ fontSize: h2, color: colors.BODY_TEXT }}>✕</Text>
        </Pressable>
        <Text
          className="flex-1 text-center font-semibold"
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          Secure Checkout
        </Text>
        <ShieldCheckIcon color={colors.SUCCESS} />
      </View>

      <View
        className="rounded-xl p-4"
        style={{ backgroundColor: colors.SURFACE_MUTED }}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className="font-semibold uppercase tracking-wide"
            style={{ fontSize: micro, color: colors.NAVY }}
          >
            {planLabel}
          </Text>
          <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>Total Amount</Text>
        </View>
        <View className="mt-2 flex-row items-end justify-between">
          <Text className="flex-1 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
            {planDisplayName}
          </Text>
          <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
            {formatInr(step5.price)}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center">
          <CalendarIcon />
          <Text className="ml-2" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            Valid for {validityDays} days
          </Text>
        </View>
      </View>

      <Text
        className="mb-3 mt-5 font-semibold uppercase tracking-wide"
        style={{ fontSize: micro, color: colors.BODY_TEXT }}
      >
        SELECT PAYMENT METHOD
      </Text>

      <View className="flex-1 justify-between">
        <View>
          <Pressable
            onPress={() => setPaymentMethod('upi')}
            className="rounded-xl border p-3"
            style={{
              borderColor: paymentMethod === 'upi' ? colors.NAVY : colors.BORDER,
              borderWidth: paymentMethod === 'upi' ? 2 : 1,
              backgroundColor: colors.WHITE,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="mr-3 items-center justify-center rounded-lg"
                style={{
                  width: width * 0.1,
                  height: width * 0.1,
                  backgroundColor: colors.INFO_BG,
                }}
              >
                <WalletIcon />
              </View>
              <View className="flex-1">
                <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                  UPI (Google Pay, PhonePe)
                </Text>
                <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>
                  Pay instantly using your UPI ID
                </Text>
              </View>
              <View
                className="h-5 w-5 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: paymentMethod === 'upi' ? colors.NAVY : colors.BORDER,
                  backgroundColor: paymentMethod === 'upi' ? colors.NAVY : colors.WHITE,
                }}
              >
                {paymentMethod === 'upi' ? (
                  <View
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: colors.WHITE,
                    }}
                  />
                ) : null}
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setPaymentMethod('card')}
            className="mt-3 rounded-xl border p-3"
            style={{
              borderColor: paymentMethod === 'card' ? colors.NAVY : colors.BORDER,
              borderWidth: paymentMethod === 'card' ? 2 : 1,
              backgroundColor: colors.WHITE,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="mr-3 items-center justify-center rounded-lg"
                style={{
                  width: width * 0.1,
                  height: width * 0.1,
                  backgroundColor: colors.INFO_BG,
                }}
              >
                <CreditCardIcon />
              </View>
              <View className="flex-1">
                <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                  Credit / Debit Card
                </Text>
                <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>
                  Visa, Mastercard, RuPay
                </Text>
              </View>
              <View
                className="h-5 w-5 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: paymentMethod === 'card' ? colors.NAVY : colors.BORDER,
                  backgroundColor: paymentMethod === 'card' ? colors.NAVY : colors.WHITE,
                }}
              >
                {paymentMethod === 'card' ? (
                  <View
                    className="rounded-full"
                    style={{ width: 8, height: 8, backgroundColor: colors.WHITE }}
                  />
                ) : null}
              </View>
            </View>

            {paymentMethod === 'card' ? (
              <View
                className="mt-3 rounded-xl p-3"
                style={{ backgroundColor: colors.SURFACE_MUTED }}
              >
                <Controller
                  control={control}
                  name="cardNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <TextInput
                        value={value}
                        onChangeText={(text) => onChange(formatCardNumber(text))}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        placeholder="Card Number"
                        placeholderTextColor={colors.BODY_TEXT}
                        maxLength={16}
                        className="rounded-xl border bg-white px-4 py-3"
                        style={{
                          borderColor: errors.cardNumber ? colors.ERROR : colors.BORDER,
                          fontSize: body,
                          color: colors.NAVY,
                        }}
                      />
                      {errors.cardNumber ? (
                        <Text style={{ fontSize: micro, color: colors.ERROR, marginTop: 4 }}>
                          {errors.cardNumber.message}
                        </Text>
                      ) : null}
                    </View>
                  )}
                />
                <View className="mt-3 flex-row" style={{ gap: width * 0.03 }}>
                  <Controller
                    control={control}
                    name="expiry"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="flex-1">
                        <TextInput
                          value={value}
                          onChangeText={(text) => onChange(formatExpiryInput(text))}
                          onBlur={onBlur}
                          keyboardType="number-pad"
                          placeholder="Expiry (MM/YY)"
                          placeholderTextColor={colors.BODY_TEXT}
                          maxLength={5}
                          className="rounded-xl border bg-white px-4 py-3"
                          style={{
                            borderColor: errors.expiry ? colors.ERROR : colors.BORDER,
                            fontSize: body,
                            color: colors.NAVY,
                          }}
                        />
                        {errors.expiry ? (
                          <Text style={{ fontSize: micro, color: colors.ERROR, marginTop: 4 }}>
                            {errors.expiry.message}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  />
                  <Controller
                    control={control}
                    name="cvv"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="flex-1">
                        <TextInput
                          value={value}
                          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 4))}
                          onBlur={onBlur}
                          keyboardType="number-pad"
                          placeholder="CVV"
                          placeholderTextColor={colors.BODY_TEXT}
                          maxLength={4}
                          secureTextEntry
                          className="rounded-xl border bg-white px-4 py-3"
                          style={{
                            borderColor: errors.cvv ? colors.ERROR : colors.BORDER,
                            fontSize: body,
                            color: colors.NAVY,
                          }}
                        />
                        {errors.cvv ? (
                          <Text style={{ fontSize: micro, color: colors.ERROR, marginTop: 4 }}>
                            {errors.cvv.message}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  />
                </View>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View>
          {apiError ? (
            <Text className="mb-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
              {apiError}
            </Text>
          ) : null}
          <PrimaryButton
            label={`Pay ${formatInr(step5.price)}`}
            showArrow
            isLoading={isPaying}
            disabled={isPaying}
            onPress={handlePayPress}
          />
        </View>
      </View>
    </View>
  );
}
