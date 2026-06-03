import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { LazyExitOnboardingModal } from '@components/ui/LazyExitOnboardingModal';
import { AddressAutocomplete } from '@components/ui/AddressAutocomplete';
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
import { useAsyncAction } from '@hooks/useAsyncAction';
import { handleApiError } from '@utils/handleApiError';
import { submitBusinessInfo } from '@services/onboardingService';
import type { PlaceResult } from '@/types/location';
import { useAuthStore } from '@store/useAuthStore';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { formatPhoneDisplay } from '@utils/formatPhone';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const step1Schema = z.object({
  businessName: z.string().min(1, 'Business name is required').min(3, 'Minimum 3 characters'),
  ownerName: z.string().min(1, 'Owner name is required').min(2, 'Minimum 2 characters'),
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
  const setStep1Data = useOnboardingStore((state) => state.setStep1Data);
  const setIsSubmitting = useOnboardingStore((state) => state.setIsSubmitting);
  const isSubmitting = useOnboardingStore((state) => state.isSubmitting);
  const phoneNumber = useAuthStore((state) => state.phoneNumber);
  const countryCode = useAuthStore((state) => state.countryCode);
  const authUser = useAuthStore((state) => state.user);

  const verifiedContactNumber =
    phoneNumber?.replace(/\D/g, '').slice(-10) ??
    authUser?.phone.replace(/\D/g, '').slice(-10) ??
    '';

  const verifiedPhoneDisplay = verifiedContactNumber
    ? formatPhoneDisplay(countryCode ?? '+91', verifiedContactNumber)
    : '';

  const { execute } = useAsyncAction();
  const [showExitModal, setShowExitModal] = useState(false);
  const currentOnboardingStep = useOnboardingStore((state) => state.currentOnboardingStep);

  const handleBack = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const handleExitConfirm = useCallback(() => {
    setShowExitModal(false);
    if (currentOnboardingStep <= 1) {
      router.replace('/');
    } else {
      router.replace('/(onboarding)/resume-choice');
    }
  }, [currentOnboardingStep, router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );

  const [locality, setLocality] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      businessAddress: '',
    },
  });

  useEffect(() => {
    const saved = useOnboardingStore.getState().step1;
    if (saved) {
      reset({
        businessName: saved.businessName,
        ownerName: saved.ownerName,
        businessAddress: saved.businessAddress,
      });
      if (saved.locality) setLocality(saved.locality);
      if (saved.latitude != null) setLatitude(saved.latitude);
      if (saved.longitude != null) setLongitude(saved.longitude);
    }
  }, [reset]);

  const handlePlaceResolved = (place: PlaceResult) => {
    setValue('businessAddress', place.formattedAddress, { shouldValidate: true });
    setLocality(place.locality ?? '');
    setLatitude(place.latitude);
    setLongitude(place.longitude);
  };

  const onSubmit = async (values: Step1FormValues) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        businessName: values.businessName,
        ownerName: values.ownerName,
        contactNumber: verifiedContactNumber,
        businessAddress: values.businessAddress,
        locality: locality.trim() || undefined,
        latitude,
        longitude,
      };
      await submitBusinessInfo(payload);
      setStep1Data(payload);
      router.push('/(onboarding)/step2-gst');
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="px-5">
        <OnboardingScreenHeader
          title="Onboarding"
          onBack={handleBack}
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
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
          <View>
            <FormTextField
              label="Contact Number"
              icon={<PhoneIcon />}
              placeholder={verifiedPhoneDisplay || '+91 00000 00000'}
              value={verifiedPhoneDisplay}
              editable={false}
              style={{
                backgroundColor: colors.SURFACE_MUTED,
                color: colors.BODY_TEXT,
              }}
            />
            <View className="mt-1 flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color={colors.SUCCESS} />
              <Text className="ml-1" style={{ fontSize: label, color: colors.SUCCESS }}>
                Mobile number verified via OTP
              </Text>
            </View>
          </View>
          <Controller
            control={control}
            name="businessAddress"
            render={({ field: { onChange, onBlur, value } }) => (
              <AddressAutocomplete
                label="Business Address"
                icon={<LocationIcon />}
                placeholder="Search place name, street, or IT park"
                multiline
                numberOfLines={3}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onPlaceResolved={handlePlaceResolved}
                mapInitialLatitude={latitude}
                mapInitialLongitude={longitude}
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
        </ScrollView>

        <View className="border-t bg-white px-5 pt-3" style={{ borderColor: colors.BORDER, paddingBottom: insets.bottom + 12 }}>
          <PrimaryButton
            label="Next Step"
            showArrow
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onPress={() => void execute(async () => handleSubmit(onSubmit)())}
          />
          {apiError ? (
            <Text className="mt-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
              {apiError}
            </Text>
          ) : null}
          <Pressable
            className="mt-4 items-center"
            onPress={() => router.replace({ pathname: '/(auth)/login', params: { mode: 'login' } })}
          >
            <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>
              Already have an account?{' '}
              <Text className="font-bold" style={{ color: colors.NAVY }}>
                Sign In
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>

    <LazyExitOnboardingModal
      visible={showExitModal}
      onClose={() => setShowExitModal(false)}
      onExit={handleExitConfirm}
      currentStep={currentOnboardingStep}
    />
    </>
  );
}
