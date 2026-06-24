import { DiamondIcon } from '@components/ui/DiamondIcon';
import { useAuthStore } from '@store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const onboardingBackground = require('@assets/images/onboarding-ring-bg.jpg') as number;

export default function LandingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const markWelcomeSeen = useAuthStore((state) => state.markWelcomeSeen);

  const handleGetStarted = () => {
    void markWelcomeSeen().then(() => {
      router.push({ pathname: '/(auth)/login', params: { mode: 'register' } });
    });
  };

  const handleLogin = () => {
    void markWelcomeSeen().then(() => {
      router.push({ pathname: '/(auth)/login', params: { mode: 'login' } });
    });
  };

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground
        source={onboardingBackground}
        resizeMode="cover"
        style={{ flex: 1, width: '100%', height: '100%' }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(10, 5, 0, 0.25)' }}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: height * 0.35,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: height * 0.4,
              backgroundColor: 'rgba(0,0,0,0.55)',
            }}
          />

          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(700)}
              style={{
                flex: 0.35,
                justifyContent: 'flex-start',
                paddingTop: 48 + insets.top,
              }}
            >
              <View
                style={{
                  alignSelf: 'center',
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
                <DiamondIcon
                  containerColor="#1B2B4B"
                  color="#FFFFFF"
                  containerSize={72}
                  size={32}
                />
              </View>

              <View style={{ width: '100%', paddingHorizontal: 8, marginTop: 16 }}>
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
                    textShadowColor: 'rgba(0,0,0,0.5)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                  }}
                >
                  GEHNAHUB
                </Text>
              </View>

              <View
                style={{
                  width: 60,
                  height: 1.5,
                  backgroundColor: '#C9A84C',
                  alignSelf: 'center',
                  marginTop: 8,
                  shadowColor: '#C9A84C',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              />

              <Text
                style={{
                  fontSize: width * 0.03,
                  color: 'rgba(255,255,255,0.75)',
                  letterSpacing: 4,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                HANDCRAFTED ELEGANCE
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(250).duration(700)}
              style={{
                flex: 0.38,
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(201, 168, 76, 0.5)',
                  backgroundColor: 'rgba(201, 168, 76, 0.08)',
                  borderRadius: 20,
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  alignSelf: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: width * 0.028,
                    letterSpacing: 2,
                    textAlign: 'center',
                  }}
                >
                  ELITE JEWELLERS NETWORK
                </Text>
              </View>

              <Text
                style={{
                  fontSize: width * 0.068,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginTop: 12,
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                Grow Your{'\n'}Jewellery Business
              </Text>

              <Text
                style={{
                  fontSize: width * 0.036,
                  color: 'rgba(255,255,255,0.80)',
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                Experience the professional B2B network for secure diamond trading and operations.
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(700)}
              style={{
                flex: 0.27,
                justifyContent: 'flex-end',
                paddingBottom: 32 + insets.bottom,
              }}
            >
              <Pressable
                onPress={handleGetStarted}
                style={{
                  backgroundColor: '#C9A84C',
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  width: '100%',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: '#0D0D0D',
                    fontSize: 16,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    textAlign: 'center',
                  }}
                >
                  Get Started →
                </Text>
              </Pressable>

              <Pressable
                onPress={handleLogin}
                style={{
                  backgroundColor: 'transparent',
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#C9A84C',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  alignItems: 'center',
                  width: '100%',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                    textAlign: 'center',
                  }}
                >
                  Login to Account
                </Text>
              </Pressable>

              <View
                style={{
                  marginTop: 8,
                  alignSelf: 'center',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                  }}
                >
                  Secure OTP-based authentication
                </Text>
              </View>
            </Animated.View>
          </View>
        </View>
      </ImageBackground>
    </>
  );
}
