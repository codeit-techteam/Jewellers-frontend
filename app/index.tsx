import { DiamondIcon } from '@components/ui/DiamondIcon';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const onboardingBackground = require('@assets/images/onboarding-bg.png') as number;

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground
        source={onboardingBackground}
        resizeMode="cover"
        style={{ flex: 1, width: '100%', height: '100%' }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ flex: 1, paddingHorizontal: 24 }}>
            <Animated.View
              entering={FadeInDown.delay(100).duration(700)}
              style={{
                flex: 0.35,
                justifyContent: 'flex-start',
                paddingTop: 48 + insets.top,
              }}
            >
              <View style={{ alignSelf: 'center' }}>
                <DiamondIcon
                  containerColor="#1B2B4B"
                  color="#FFFFFF"
                  containerSize={72}
                  size={32}
                />
              </View>

              <Text
                style={{
                  fontWeight: '800',
                  letterSpacing: 8,
                  color: '#FFFFFF',
                  fontSize: width * 0.13,
                  textAlign: 'center',
                  marginTop: 16,
                }}
              >
                GEHNAHUB
              </Text>

              <View
                style={{
                  width: 80,
                  height: 1.5,
                  backgroundColor: '#C9A84C',
                  alignSelf: 'center',
                  marginTop: 8,
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
                  borderColor: 'rgba(255,255,255,0.4)',
                  borderRadius: 20,
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  alignSelf: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
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
                  fontSize: width * 0.072,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginTop: 12,
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
                onPress={() =>
                  router.push({ pathname: '/(auth)/login', params: { mode: 'register' } })
                }
                style={{
                  backgroundColor: '#1B2B4B',
                  borderRadius: 14,
                  paddingVertical: 16,
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: width * 0.042,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  Get Started →
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(auth)/login', params: { mode: 'login' } })
                }
                style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.35)',
                  borderRadius: 14,
                  paddingVertical: 16,
                  width: '100%',
                  marginTop: 12,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: width * 0.042,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  Login to Account
                </Text>
              </Pressable>

              <View
                style={{
                  marginTop: 14,
                  alignSelf: 'center',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text
                  style={{
                    fontSize: width * 0.03,
                    color: 'rgba(255,255,255,0.75)',
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
