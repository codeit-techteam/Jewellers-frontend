import { DiamondIcon } from '@components/ui/DiamondIcon';
import { SwitchAccountModal } from '@components/ui/SwitchAccountModal';
import { getResumeRoute } from '@lib/getResumeRoute';
import { useAuthStore } from '@store/useAuthStore';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { useInventoryStore } from '@store/useInventoryStore';
import { useLeadsStore } from '@store/useLeadsStore';
import { useProfileStore } from '@store/useProfileStore';
import { getStepName } from '@utils/getStepName';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { ImageBackground, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const onboardingBackground = require('@assets/images/onboarding-ring-bg.jpg') as number;

const AUTH_TOKEN_KEY = 'auth_token';
const ONBOARDING_META_KEY = 'onboarding_meta';

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+91 ••••• ${digits.slice(-5)}`;
  }
  return `+91 ••••• •••••`;
}

function getPhoneAvatar(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 2 ? digits.slice(-2) : '••';
}

export default function ResumeChoiceScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const user = useAuthStore((state) => state.user);
  const onboardingStep = useAuthStore((state) => state.onboardingStep);
  const isOnboardingComplete = useAuthStore((state) => state.isOnboardingComplete);
  const storeStatus = useAuthStore((state) => state.storeStatus);

  const phone = user?.phone ?? '';
  const completedSteps = Math.min(onboardingStep - 1, 5);
  const stepName = getStepName(onboardingStep);
  const maskedPhone = maskPhone(phone);
  const phoneAvatar = getPhoneAvatar(phone);

  const resumeRoute = getResumeRoute(
    isOnboardingComplete,
    onboardingStep,
    storeStatus ?? undefined,
    undefined,
  );

  const handleContinue = () => {
    router.replace(resumeRoute);
  };

  const handleSwitchConfirm = async () => {
    setShowSwitchModal(false);
    try {
      await useAuthStore.getState().logout();
    } catch {
      // best effort
    }
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => null);
    await SecureStore.deleteItemAsync(ONBOARDING_META_KEY).catch(() => null);
    useOnboardingStore.getState().resetOnboarding();
    useInventoryStore.getState().reset();
    useLeadsStore.getState().reset();
    useProfileStore.getState().reset();
    router.replace('/');
  };

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground
        source={onboardingBackground}
        resizeMode="cover"
        style={{ flex: 1, width: '100%', height: '100%' }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center' }}>
          {/* Top section: logo */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                borderWidth: 1.5,
                borderColor: 'rgba(201, 168, 76, 0.6)',
                borderRadius: 37,
                shadowColor: '#C9A84C',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <DiamondIcon containerColor="#1B2B4B" color="#FFFFFF" containerSize={72} size={32} />
            </View>

            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              style={{
                fontWeight: '800',
                letterSpacing: 4,
                color: '#FFFFFF',
                fontSize: width * 0.095,
                textAlign: 'center',
                marginTop: 14,
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
                paddingHorizontal: 16,
              }}
            >
              GEHNAHUB
            </Text>
          </View>

          {/* White card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              marginHorizontal: 24,
              padding: 24,
            }}
          >
            {/* Gold divider */}
            <View
              style={{
                width: 40,
                height: 3,
                backgroundColor: '#C9A84C',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 20,
                shadowColor: '#C9A84C',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
              }}
            />

            <Text
              style={{
                fontSize: width * 0.062,
                fontWeight: '700',
                color: '#111827',
                textAlign: 'center',
              }}
            >
              Welcome Back!
            </Text>

            <Text
              style={{
                fontSize: width * 0.036,
                color: '#6B7280',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              You have an ongoing registration.
            </Text>

            {/* User info card */}
            <View
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 16,
                padding: 16,
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {/* Avatar */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#1B2B4B',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 18 }}>
                  {phoneAvatar}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: width * 0.038,
                    fontWeight: '700',
                    color: '#111827',
                  }}
                >
                  {maskedPhone}
                </Text>
                <Text
                  style={{
                    fontSize: width * 0.032,
                    color: '#6B7280',
                    marginTop: 2,
                  }}
                >
                  {stepName}
                </Text>
                <Text
                  style={{
                    fontSize: width * 0.028,
                    color: '#9CA3AF',
                    marginTop: 1,
                  }}
                >
                  Last active step
                </Text>
              </View>

              {/* Progress pill */}
              <View
                style={{
                  backgroundColor: '#1B2B4B',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  flexShrink: 0,
                }}
              >
                <Text
                  style={{
                    fontSize: width * 0.032,
                    color: '#FFFFFF',
                    fontWeight: '700',
                  }}
                >
                  {completedSteps} / 5
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={{ marginTop: 20 }}>
              {/* Continue Registration */}
              <Pressable
                onPress={handleContinue}
                style={{
                  backgroundColor: '#1B2B4B',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  shadowColor: '#1B2B4B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: width * 0.042,
                    fontWeight: '600',
                  }}
                >
                  Continue Registration
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: width * 0.032,
                    marginTop: 3,
                  }}
                >
                  Resume from {stepName}
                </Text>
              </Pressable>

              {/* Switch Account */}
              <Pressable
                onPress={() => setShowSwitchModal(true)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: 'center',
                  marginTop: 12,
                }}
              >
                <Text
                  style={{
                    color: '#374151',
                    fontSize: width * 0.038,
                    fontWeight: '500',
                  }}
                >
                  Switch Account
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Bottom safe area spacer */}
          <View style={{ height: insets.bottom + 16 }} />
        </View>
      </ImageBackground>

      <SwitchAccountModal
        visible={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        onConfirm={() => void handleSwitchConfirm()}
        currentPhone={phone}
      />
    </>
  );
}
