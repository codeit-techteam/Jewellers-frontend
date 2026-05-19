import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { FormTextField } from '@components/ui/FormTextField';
import {
  LocationIcon,
  PersonIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StoreIcon,
} from '@components/ui/OnboardingIcons';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { StepProgressBar } from '@components/ui/StepProgressBar';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { ApiError } from '@services/api';
import { submitBusinessInfo } from '@services/onboardingService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const step1Schema = z.object({
  businessName: z.string().min(1, 'Business name is required').min(3, 'Minimum 3 characters'),
  ownerName: z.string().min(1, 'Owner name is required').min(2, 'Minimum 2 characters'),
  contactNumber: z
    .string()
    .min(1, 'Contact number is required')
    .regex(/^\d{10}$/, 'Enter a valid 10-digit number'),
  businessAddress: z
    .string()
    .min(1, 'Business address is required')
    .min(10, 'Minimum 10 characters'),
});

type Step1FormValues = z.infer<typeof step1Schema>;

export default function Step1BusinessInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, h1, body, label } = useFontScale();
  const savedStep1 = useOnboardingStore((state) => state.step1);
  const setStep1Data = useOnboardingStore((state) => state.setStep1Data);
  const setIsSubmitting = useOnboardingStore((state) => state.setIsSubmitting);
  const isSubmitting = useOnboardingStore((state) => state.isSubmitting);

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: savedStep1?.businessName ?? '',
      ownerName: savedStep1?.ownerName ?? '',
      contactNumber: savedStep1?.contactNumber ?? '',
      businessAddress: savedStep1?.businessAddress ?? '',
    },
  });

  useEffect(() => {
    if (savedStep1) {
      reset(savedStep1);
    }
  }, [savedStep1, reset]);

  const onSubmit = async (values: Step1FormValues) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await submitBusinessInfo(values);
      setStep1Data(values);
      router.push('/(onboarding)/step2-gst');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to save. Please try again.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      className="flex-1 bg-white px-5"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}
    >
      <StatusBar style="dark" />
      <OnboardingScreenHeader
        title="Onboarding"
        onBack={() => router.replace('/(auth)/login')}
      />

      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
            Step 1: Business Info
          </Text>
          <Text className="mt-1" style={{ fontSize: body, color: colors.BODY_TEXT }}>
            Tell us about your jewelry business
          </Text>
        </View>
        <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>1 of 5</Text>
      </View>

      <StepProgressBar
        currentStep={1}
        totalSteps={5}
        percentLabel="20% Complete"
        showStepLabels={false}
      />

      <View className="mt-4 flex-1 justify-between">
        <View>
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormTextField
                label="Business Name"
                icon={<StoreIcon />}
                placeholder="e.g., Diamond Heights Jewellers"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.businessName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="ownerName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormTextField
                label="Owner Name"
                icon={<PersonIcon />}
                placeholder="Full Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.ownerName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="contactNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormTextField
                label="Contact Number"
                icon={<PhoneIcon />}
                placeholder="+91 6290887334"
                keyboardType="phone-pad"
                maxLength={10}
                value={value}
                onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 10))}
                onBlur={onBlur}
                error={errors.contactNumber?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="businessAddress"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormTextField
                label="Business Address"
                icon={<LocationIcon />}
                placeholder="Full street address, City, Country"
                multiline
                numberOfLines={3}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.businessAddress?.message}
                style={{ minHeight: width * 0.2 }}
              />
            )}
          />

          <View
            className="flex-row rounded-xl border p-3"
            style={{
              backgroundColor: colors.INFO_BG,
              borderColor: colors.INFO_BORDER,
            }}
          >
            <ShieldCheckIcon color={colors.NAVY} />
            <Text
              className="ml-3 flex-1 leading-relaxed"
              style={{ fontSize: label, color: colors.BODY_TEXT }}
            >
              Your information is encrypted and will only be used for professional business
              verification purposes.
            </Text>
          </View>
        </View>

        <View>
          <PrimaryButton
            label="Next Step"
            showArrow
            isLoading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
          {apiError ? (
            <Text className="mt-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
              {apiError}
            </Text>
          ) : null}
          <Pressable
            className="mt-4 items-center"
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>
              Already have an account?{' '}
              <Text className="font-bold" style={{ color: colors.NAVY }}>
                Sign In
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
