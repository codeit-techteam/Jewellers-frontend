import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { DocumentUploader } from '@components/ui/DocumentUploader';
import { StepNavButtons } from '@components/ui/StepNavButtons';
import { StepProgressBar } from '@components/ui/StepProgressBar';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { handleApiError } from '@utils/handleApiError';
import { uploadGSTCertificate } from '@services/onboardingService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { Step2Data } from '@/types/onboarding';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Step2GstScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { h1, body, label } = useFontScale();

  const setStep2Data = useOnboardingStore((state) => state.setStep2Data);
  const isSubmitting = useOnboardingStore((state) => state.isSubmitting);
  const setIsSubmitting = useOnboardingStore((state) => state.setIsSubmitting);

  const [file, setFile] = useState<Step2Data | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const saved = useOnboardingStore.getState().step2;
    if (saved) {
      setFile(saved);
    }
  }, []);

  const handleNext = async () => {
    if (!file?.fileName) {
      setFileError('Please upload your GST certificate to continue');
      return;
    }

    setFileError(null);
    setApiError(null);
    setIsSubmitting(true);
    try {
      await uploadGSTCertificate(file.fileUri, file.fileName);
      setStep2Data(file);
      router.push('/(onboarding)/step3-bis');
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
        onBack={() => router.back()}
      />

      <StepProgressBar currentStep={2} totalSteps={5} percentLabel="40% Complete" />

      <Text className="mb-2 mt-4 font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
        Upload GST Certificate
      </Text>
      <Text className="mb-4 leading-relaxed" style={{ fontSize: body, color: colors.BODY_TEXT }}>
        Please upload your GST registration certificate (Form REG-06) to verify your jewellery
        business identity.
      </Text>

      <View className="flex-1 justify-between">
        <DocumentUploader
          file={file}
          onFileChange={(next) => {
            setFile(next);
            setFileError(null);
          }}
          showActionButtons
          showQuickTip
          error={fileError ?? undefined}
        />

        <View>
          {apiError ? (
            <Text className="mb-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
              {apiError}
            </Text>
          ) : null}
          <StepNavButtons
            onBack={() => router.back()}
            onNext={() => void handleNext()}
            isLoading={isSubmitting}
          />
        </View>
      </View>
    </View>
  );
}
