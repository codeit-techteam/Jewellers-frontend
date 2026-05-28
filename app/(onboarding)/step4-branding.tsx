import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { CloudUploadIcon } from '@components/ui/OnboardingIcons';
import { StepNavButtons } from '@components/ui/StepNavButtons';
import { StepProgressBar } from '@components/ui/StepProgressBar';
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { useAsyncAction } from '@hooks/useAsyncAction';
import { handleApiError } from '@utils/handleApiError';
import { dialog } from '@utils/dialog';
import { submitBranding } from '@services/onboardingService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAGLINE_MAX = 60;
const DEFAULT_TAGLINE = 'Elegance in every facet';
const NAVY_BANNER = '#1B2B4B';

async function pickBrandingImage(aspect: [number, number]): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    void dialog.alert('Permission required', 'Photo library access is needed to upload images.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return result.assets[0].uri;
}

export default function Step4BrandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, h1, body, label, micro } = useFontScale();

  const step1 = useOnboardingStore((state) => state.step1);
  const setStep4Data = useOnboardingStore((state) => state.setStep4Data);
  const isSubmitting = useOnboardingStore((state) => state.isSubmitting);
  const setIsSubmitting = useOnboardingStore((state) => state.setIsSubmitting);

  const { execute } = useAsyncAction();

  const handleBack = useCallback(() => {
    router.replace('/(onboarding)/step3-bis');
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

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [tagline, setTagline] = useState(DEFAULT_TAGLINE);
  const [apiError, setApiError] = useState<string | null>(null);

  const storeName = step1?.businessName ?? 'Royal Jewellers';
  const taglineCount = tagline.length;
  const previewBannerHeight = width * 0.28;

  useEffect(() => {
    const saved = useOnboardingStore.getState().step4;
    if (saved) {
      setLogoUri(saved.logoUri);
      setCoverImageUri(saved.coverImageUri ?? null);
      setTagline(saved.tagline || DEFAULT_TAGLINE);
    }
  }, []);

  const handleCoverUpload = async () => {
    const uri = await pickBrandingImage([3, 1]);
    if (uri) {
      setCoverImageUri(uri);
    }
  };

  const handleLogoUpload = async () => {
    const uri = await pickBrandingImage([1, 1]);
    if (uri) {
      setLogoUri(uri);
    }
  };

  const handleContinue = async () => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const data = { logoUri, coverImageUri, tagline };
      await submitBranding(data);
      setStep4Data(data);
      router.push('/(onboarding)/step5-products');
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPreviewBanner = () => {
    const logoSize = width * 0.16;
    const bannerContent = (
      <View
        style={{
          height: previewBannerHeight,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: logoSize / 2,
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            borderRadius: 20,
            backgroundColor: colors.NAVY,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: micro, color: colors.WHITE }}>Mobile View</Text>
        </View>
      </View>
    );

    if (coverImageUri) {
      return (
        <ImageBackground
          source={{ uri: coverImageUri }}
          resizeMode="cover"
          style={{ height: previewBannerHeight }}
        >
          {bannerContent}
        </ImageBackground>
      );
    }

    return (
      <View style={{ height: previewBannerHeight, backgroundColor: NAVY_BANNER }}>
        {bannerContent}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="px-5">
        <OnboardingScreenHeader title="Store Branding" onBack={handleBack} />
        <StepProgressBar currentStep={4} totalSteps={5} percentLabel="80% Complete" />
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
          <Text
            className="mb-3 mt-2 font-semibold uppercase tracking-wider"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            LIVE PREVIEW
          </Text>

          <View
            className="mb-5 overflow-hidden rounded-xl border"
            style={{ borderColor: colors.BORDER, backgroundColor: colors.PREVIEW_BG }}
          >
            {renderPreviewBanner()}

            <View
              className="items-center px-4"
              style={{ marginTop: -(width * 0.16) / 2, paddingBottom: 16 }}
            >
              {logoUri ? (
                <Image
                  source={{ uri: logoUri }}
                  style={{
                    width: width * 0.16,
                    height: width * 0.16,
                    borderRadius: width * 0.08,
                    borderWidth: 3,
                    borderColor: colors.WHITE,
                  }}
                />
              ) : (
                <View
                  className="items-center justify-center rounded-full border"
                  style={{
                    width: width * 0.16,
                    height: width * 0.16,
                    backgroundColor: `${colors.SUCCESS}33`,
                    borderColor: colors.WHITE,
                    borderWidth: 3,
                  }}
                >
                  <Text style={{ fontSize: h1, color: colors.GOLD }}>💎</Text>
                </View>
              )}
              <Text className="mt-3 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                {storeName}
              </Text>
              <Text className="mt-1 italic" style={{ fontSize: label, color: colors.BODY_TEXT }}>
                &ldquo;{tagline || DEFAULT_TAGLINE}&rdquo;
              </Text>
            </View>
          </View>

          <Text className="mb-1 font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
            Store Cover Image
          </Text>
          <Text className="mb-2" style={{ fontSize: label, color: colors.BODY_TEXT }}>
            This appears as the banner background on your live store page.
          </Text>
          <Pressable
            onPress={() => void handleCoverUpload()}
            className="mb-5 overflow-hidden rounded-xl border border-dashed"
            style={{
              borderColor: colors.UPLOAD_BORDER_DASHED,
              backgroundColor: colors.UPLOAD_BG,
              aspectRatio: 16 / 9,
            }}
          >
            {coverImageUri ? (
              <ImageBackground source={{ uri: coverImageUri }} resizeMode="cover" style={{ flex: 1 }}>
                <View className="flex-1 items-end p-2">
                  <View
                    className="rounded-lg px-3 py-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                  >
                    <Text style={{ fontSize: micro, color: colors.WHITE, fontWeight: '600' }}>
                      Change
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            ) : (
              <View className="flex-1 items-center justify-center px-4 py-6">
                <View
                  className="mb-3 items-center justify-center rounded-full"
                  style={{
                    width: width * 0.12,
                    height: width * 0.12,
                    backgroundColor: colors.INFO_BG,
                  }}
                >
                  <CloudUploadIcon size={width * 0.05} />
                </View>
                <Text style={{ fontSize: body, color: colors.NAVY, fontWeight: '600' }}>
                  Click to upload cover image
                </Text>
                <Text className="mt-1 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                  JPG, PNG up to 10MB (Recommended: 1200x400px)
                </Text>
              </View>
            )}
          </Pressable>

          <Text className="mb-2 font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
            Store Logo
          </Text>
          <Pressable
            onPress={() => void handleLogoUpload()}
            className="mb-5 items-center justify-center rounded-xl border border-dashed px-4 py-8"
            style={{
              borderColor: colors.UPLOAD_BORDER_DASHED,
              backgroundColor: colors.UPLOAD_BG,
            }}
          >
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={{ width: width * 0.2, height: width * 0.2, borderRadius: 12 }}
                resizeMode="contain"
              />
            ) : (
              <>
                <View
                  className="mb-3 items-center justify-center rounded-full"
                  style={{
                    width: width * 0.14,
                    height: width * 0.14,
                    backgroundColor: colors.INFO_BG,
                  }}
                >
                  <CloudUploadIcon size={width * 0.06} />
                </View>
                <Text style={{ fontSize: body, color: colors.NAVY }}>
                  <Text className="font-semibold">Click to upload</Text>
                  <Text style={{ color: colors.BODY_TEXT }}> or drag and drop</Text>
                </Text>
                <Text className="mt-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                  PNG, JPG up to 5MB (Min 500x500px)
                </Text>
              </>
            )}
          </Pressable>

          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
              Store Tagline
            </Text>
            <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>
              {taglineCount}/{TAGLINE_MAX}
            </Text>
          </View>
          <TextInput
            value={tagline}
            onChangeText={(text) => setTagline(text.slice(0, TAGLINE_MAX))}
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: colors.BORDER,
              fontSize: body,
              color: colors.NAVY,
            }}
            placeholder="Elegance in every facet"
            placeholderTextColor={colors.BODY_TEXT}
          />
          <Text className="mt-2" style={{ fontSize: label, color: colors.BODY_TEXT }}>
            This tagline appears below your logo on the customer storefront.
          </Text>
        </ScrollView>

        <View
          className="border-t bg-white px-5 pt-3"
          style={{ borderColor: colors.BORDER, paddingBottom: insets.bottom + 12 }}
        >
          {apiError ? (
            <Text className="mb-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
              {apiError}
            </Text>
          ) : null}
          <StepNavButtons
            onBack={handleBack}
            onNext={() => void execute(handleContinue)}
            nextLabel="Continue to Launch"
            isLoading={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
