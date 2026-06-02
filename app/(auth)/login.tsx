import { CountryPickerTrigger, LazyCountryPicker } from '@components/ui/LazyCountryPicker';
import { DiamondIcon } from '@components/ui/DiamondIcon';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { DEFAULT_COUNTRY } from '@constants/countries';
import { colors } from '@constants/colors';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFontScale } from '@hooks/useFontScale';
import { useAsyncAction } from '@hooks/useAsyncAction';
import { handleApiError } from '@utils/handleApiError';
import { sendOtp } from '@services/authService';
import { useAuthStore } from '@store/useAuthStore';
import type { CountryOption } from '@/types/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width, h1, h2, body, label, micro } = useFontScale();
  const params = useLocalSearchParams<{ mode?: string }>();
  const setPhoneForOtp = useAuthStore((state) => state.setPhoneForOtp);
  const setAuthFlowMode = useAuthStore((state) => state.setAuthFlowMode);

  const { execute } = useAsyncAction();

  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(DEFAULT_COUNTRY);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegisterMode = params.mode === 'register';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  const headerHeight = height * 0.22;

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      setAuthFlowMode(isRegisterMode ? 'register' : 'login');
      await sendOtp(selectedCountry.dial, values.phone);
      setPhoneForOtp(values.phone, selectedCountry.dial);
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: values.phone, countryCode: selectedCountry.dial },
      });
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.CREAM }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View
        style={{ height: headerHeight, paddingTop: insets.top }}
        className="items-center justify-center"
      >
        <DiamondIcon
          containerColor={colors.WHITE}
          color={colors.GOLD}
          containerSize={width * 0.14}
          size={width * 0.055}
        />
        <Text className="mt-3 font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          Jeweller Login
        </Text>
        <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>Exclusive B2B Access</Text>
      </View>

      <View
        className="flex-1 rounded-t-3xl bg-white px-6"
        style={{ paddingBottom: insets.bottom + height * 0.02 }}
      >
        <View className="flex-1 justify-between pt-6">
          <View>
            <Text className="text-center font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text
              className="mt-3 text-center leading-relaxed"
              style={{ fontSize: body, color: colors.BODY_TEXT }}
            >
              Enter your registered mobile number to receive a secure OTP for authentication.
            </Text>

            <Text
              className="mb-2 mt-6 font-semibold tracking-wider"
              style={{ fontSize: label, color: colors.BODY_TEXT }}
            >
              MOBILE NUMBER
            </Text>

            <View className="flex-row items-center" style={{ gap: width * 0.025 }}>
              <CountryPickerTrigger
                selected={selectedCountry}
                onPress={() => setPickerVisible(true)}
              />
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 10))}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="00000 00000"
                    placeholderTextColor={colors.BORDER}
                    className="flex-1 rounded-xl border px-4 font-medium"
                    style={{
                      borderColor: colors.BORDER,
                      fontSize: body,
                      color: colors.NAVY,
                      minHeight: 52,
                    }}
                  />
                )}
              />
            </View>

            {errors.phone ? (
              <Text className="mt-2" style={{ fontSize: label, color: colors.ERROR }}>
                {errors.phone.message}
              </Text>
            ) : null}

            <View className="mt-4 flex-row items-center justify-center">
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>🔒 </Text>
              <Text className="tracking-wider" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                SECURE 256-BIT ENCRYPTED LOGIN
              </Text>
            </View>
          </View>

          <View>
            <PrimaryButton
              label="Send OTP"
              showArrow
              isLoading={isSubmitting}
              disabled={isSubmitting}
              onPress={() => void execute(async () => handleSubmit(onSubmit)())}
            />
            {apiError ? (
              <Text className="mt-3 text-center" style={{ fontSize: label, color: colors.ERROR }}>
                {apiError}
              </Text>
            ) : null}

            <View
              className="mt-6 flex-row items-center justify-center"
              style={{ gap: width * 0.08 }}
            >
              <View className="flex-row items-center">
                <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>✓ </Text>
                <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>VERIFIED B2B</Text>
              </View>
              <View className="flex-row items-center">
                <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>🛡 </Text>
                <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>PCI COMPLIANT</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <LazyCountryPicker
        visible={pickerVisible}
        selected={selectedCountry}
        onSelect={setSelectedCountry}
        onClose={() => setPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
