import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { CheckCircleIcon, InfoIcon } from '@components/ui/OnboardingIcons';
import { DocumentUploader } from '@components/ui/DocumentUploader';
import { StepNavButtons } from '@components/ui/StepNavButtons';
import { StepProgressBar } from '@components/ui/StepProgressBar';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { useAsyncAction } from '@hooks/useAsyncAction';
import { handleApiError } from '@utils/handleApiError';
import { uploadBISCertificate } from '@services/onboardingService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { Step2Data } from '@/types/onboarding';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHECKLIST_ITEMS = [
  'Ensure the certificate number is clearly visible',
  'The document must be currently valid',
];

export default function Step3BisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, h1, body, label } = useFontScale();

  const setStep3Data = useOnboardingStore((state) => state.setStep3Data);
  const isSubmitting = useOnboardingStore((state) => state.isSubmitting);
  const setIsSubmitting = useOnboardingStore((state) => state.setIsSubmitting);

  const { execute } = useAsyncAction();

  const handleBack = useCallback(() => {
    router.replace('/(onboarding)/step2-gst');
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );

  const [file, setFile] = useState<Step2Data | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const saved = useOnboardingStore.getState().step3;
    if (saved) {
      setFile(saved);
    }
  }, []);

  const handleNext = async () => {
    if (!file?.fileName || !file?.fileUri) {
      setFileError('Please upload your BIS certificate to continue');
      return;
    }

    setFileError(null);
    setApiError(null);
    setIsSubmitting(true);
    try {
      // Small delay to ensure file picker is fully dismissed before upload starts
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      await uploadBISCertificate(file.fileUri, file.fileName);
      setStep3Data(file);
      router.push('/(onboarding)/step4-branding');
    } catch (error) {
      setApiError(handleApiError(error));
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
        title="Business Onboarding"
        onBack={handleBack}
      />

      <StepProgressBar currentStep={3} totalSteps={5} percentLabel="60% Complete" />

      <Text className="mb-2 mt-4 font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
        BIS Certificate Upload
      </Text>
      <Text className="mb-4 leading-relaxed" style={{ fontSize: body, color: colors.BODY_TEXT }}>
        Please upload a clear photo or PDF of your Bureau of Indian Standards (BIS) hallmark
        certificate.
      </Text>

      <View className="flex-1 justify-between">
        <View>
          <View
            className="mb-4 flex-row rounded-xl border p-3"
            style={{
              backgroundColor: colors.INFO_BG,
              borderColor: colors.INFO_BORDER,
            }}
          >
            <InfoIcon />
            <View className="ml-3 flex-1">
              <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                Why is this required?
              </Text>
              <Text className="mt-1 leading-relaxed" style={{ fontSize: label, color: colors.BODY_TEXT }}>
                A valid BIS license ensures authenticity and builds trust within the B2B jewelry
                marketplace. This is mandatory for trading hallmarked items.
              </Text>
            </View>
          </View>

          <DocumentUploader
            file={file}
            onFileChange={(next) => {
              setFile(next);
              setFileError(null);
            }}
            uploadTitle="Click to upload"
            showActionButtons={false}
            showQuickTip={false}
            showSelectedSection={Boolean(file)}
            error={fileError ?? undefined}
          />

          <View className="mt-4" style={{ gap: width * 0.025 }}>
            {CHECKLIST_ITEMS.map((item) => (
              <View key={item} className="flex-row items-center">
                <CheckCircleIcon />
                <Text className="ml-2 flex-1" style={{ fontSize: label, color: colors.BODY_TEXT }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          {apiError ? (
            <Text className="mb-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
              {apiError}
            </Text>
          ) : null}
          <StepNavButtons
            onBack={handleBack}
            onNext={() => void execute(handleNext)}
            isLoading={isSubmitting}
          />
        </View>
      </View>
    </View>
  );
}
