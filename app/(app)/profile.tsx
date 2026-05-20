import { DiamondIcon } from '@components/ui/DiamondIcon';
import { colors } from '@constants/colors';
import { SUPPORT_PHONE } from '@constants/profile';
import { useAuthStore } from '@store/useAuthStore';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { useInventoryStore } from '@store/useInventoryStore';
import { useLeadsStore } from '@store/useLeadsStore';
import { useProfileStore } from '@store/useProfileStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RETURN_TO_PROFILE } from '@lib/navigateBack';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SettingsRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle: string;
  rightElement?: React.ReactNode;
  onPress: () => void;
  body: number;
  micro: number;
  isLast?: boolean;
};

function SettingsRow({
  icon,
  label,
  subtitle,
  rightElement,
  onPress,
  body,
  micro,
  isLast = false,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-4"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.BORDER,
      }}
    >
      <View
        className="mr-3 items-center justify-center rounded-lg"
        style={{
          width: 36,
          height: 36,
          backgroundColor: colors.INFO_BG,
        }}
      >
        <Ionicons name={icon} size={20} color={colors.NAVY} />
      </View>
      <View className="flex-1 pr-2">
        <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
          {label}
        </Text>
        <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{subtitle}</Text>
      </View>
      {rightElement ?? <Ionicons name="chevron-forward" size={18} color={colors.BODY_TEXT} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;
  const button = width * 0.042;

  const profile = useProfileStore((state) => state.profile);
  const syncFromOnboarding = useProfileStore((state) => state.syncFromOnboarding);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const resetProfile = useProfileStore((state) => state.resetToInitial);
  const logout = useAuthStore((state) => state.logout);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const setStep4Data = useOnboardingStore((state) => state.setStep4Data);
  const step5 = useOnboardingStore((state) => state.step5);
  const resetInventory = useInventoryStore((state) => state.resetToInitial);
  const resetLeads = useLeadsStore((state) => state.resetToInitial);

  const planName = step5?.planName ?? 'Free Plan';
  const isPaidPlan = planName.toLowerCase() !== 'free' && planName.toLowerCase() !== 'free plan';

  useEffect(() => {
    syncFromOnboarding();
  }, [syncFromOnboarding]);

  const handleLogoPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed to update your logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const logoUri = result.assets[0].uri;
    updateProfile({ logoUri });
    const step4 = useOnboardingStore.getState().step4;
    setStep4Data({
      logoUri,
      coverImageUri: step4?.coverImageUri ?? null,
      tagline: step4?.tagline ?? '',
    });
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'How would you like to reach us?', [
      {
        text: '📞 Call Support',
        onPress: () => void Linking.openURL(`tel:${SUPPORT_PHONE}`),
      },
      {
        text: '💬 WhatsApp Support',
        onPress: () => void Linking.openURL('https://wa.me/919876543210'),
      },
      {
        text: '📧 Email Support',
        onPress: () => void Linking.openURL('mailto:support@gehnahub.com'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleOpenMaps = () => {
    const encoded = encodeURIComponent(profile.address);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logout();
            resetOnboarding();
            resetInventory();
            resetLeads();
            resetProfile();
            router.replace('/');
          })();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <Text className="mb-4 text-center font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
        Profile Settings
      </Text>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => void handleLogoPick()} className="items-center">
          <View className="relative">
            <View
              className="items-center justify-center overflow-hidden rounded-2xl border"
              style={{
                width: 80,
                height: 80,
                borderColor: colors.BORDER,
                backgroundColor: colors.SURFACE_MUTED,
              }}
            >
              {profile.logoUri ? (
                <Image
                  source={{ uri: profile.logoUri }}
                  style={{ width: 80, height: 80 }}
                  resizeMode="cover"
                />
              ) : (
                <DiamondIcon
                  size={width * 0.08}
                  containerSize={72}
                  containerColor={colors.SURFACE_MUTED}
                  color={colors.GOLD}
                />
              )}
            </View>
            <View
              className="absolute -bottom-1 -right-1 items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                backgroundColor: colors.NAVY,
              }}
            >
              <Ionicons name="camera" size={14} color={colors.WHITE} />
            </View>
          </View>
        </Pressable>

        <Text className="mt-4 text-center font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          {profile.businessName}
        </Text>
        <View className="mt-2 flex-row items-center justify-center">
          <Ionicons name="checkmark-circle" size={16} color={colors.NAVY} />
          <Text className="ml-1 font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
            Verified B2B Member
          </Text>
        </View>
        <Text className="mt-1 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          Member ID: {profile.memberId}
        </Text>

        <Text
          className="mb-2 mt-6 uppercase tracking-wider"
          style={{ fontSize: micro, color: colors.BODY_TEXT }}
        >
          Business Details
        </Text>
        <View className="overflow-hidden rounded-xl border" style={{ borderColor: colors.BORDER }}>
          <SettingsRow
            icon="storefront-outline"
            label="Edit Business Info"
            subtitle="Name, contact, and primary location"
            onPress={() =>
              router.push({
                pathname: '/(app)/business-profile',
                params: { returnTo: RETURN_TO_PROFILE },
              })
            }
            body={body}
            micro={micro}
          />
          <SettingsRow
            icon="call-outline"
            label="Contact Support"
            subtitle={`${SUPPORT_PHONE} • support@gehnahub.com`}
            onPress={handleContactSupport}
            body={body}
            micro={micro}
          />
          <SettingsRow
            icon="location-outline"
            label="Registered Office"
            subtitle={profile.address}
            onPress={handleOpenMaps}
            body={body}
            micro={micro}
          />
          <SettingsRow
            icon="card-outline"
            label="Subscription Plan"
            subtitle={planName}
            onPress={() =>
              router.push({
                pathname: '/(onboarding)/step5-subscription',
                params: { returnTo: RETURN_TO_PROFILE },
              })
            }
            body={body}
            micro={micro}
            rightElement={
              <View
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: isPaidPlan ? colors.TIP_BG : colors.SURFACE_MUTED,
                }}
              >
                <Text
                  style={{
                    fontSize: micro,
                    color: isPaidPlan ? colors.GOLD : colors.BODY_TEXT,
                    fontWeight: '700',
                  }}
                >
                  {planName}
                </Text>
              </View>
            }
          />
          <SettingsRow
            icon="storefront-outline"
            label="My Live Store"
            subtitle="View and manage your storefront"
            onPress={() =>
              router.push({
                pathname: '/(app)/my-live-store',
                params: { returnTo: RETURN_TO_PROFILE },
              })
            }
            body={body}
            micro={micro}
            isLast
          />
        </View>

        <Text
          className="mb-2 mt-6 uppercase tracking-wider"
          style={{ fontSize: micro, color: colors.BODY_TEXT }}
        >
          Legal & Compliance
        </Text>
        <View className="overflow-hidden rounded-xl border" style={{ borderColor: colors.BORDER }}>
          <SettingsRow
            icon="document-text-outline"
            label="GST Certificate"
            subtitle="Updated Jan 2024"
            onPress={() =>
              router.push({
                pathname: '/(app)/business-documents',
                params: { highlightDoc: 'gst', returnTo: RETURN_TO_PROFILE },
              })
            }
            body={body}
            micro={micro}
            rightElement={
              <View className="flex-row items-center">
                <View
                  className="mr-2 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${colors.SUCCESS}22` }}
                >
                  <Text style={{ fontSize: micro, color: colors.SUCCESS, fontWeight: '700' }}>
                    VERIFIED
                  </Text>
                </View>
                <Ionicons name="download-outline" size={18} color={colors.BODY_TEXT} />
              </View>
            }
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="BIS License"
            subtitle="License No: BIS-992011"
            onPress={() =>
              router.push({
                pathname: '/(app)/business-documents',
                params: { highlightDoc: 'bis', returnTo: RETURN_TO_PROFILE },
              })
            }
            body={body}
            micro={micro}
            isLast
            rightElement={
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: colors.TIP_BG }}
              >
                <Text style={{ fontSize: micro, color: colors.GOLD, fontWeight: '700' }}>
                  EXPIRING SOON
                </Text>
              </View>
            }
          />
        </View>

        <Pressable
          onPress={handleLogout}
          className="mt-6 flex-row items-center justify-center rounded-xl border py-4"
          style={{ borderColor: `${colors.ERROR}55` }}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.ERROR} />
          <Text className="ml-2 font-semibold" style={{ fontSize: button, color: colors.ERROR }}>
            Logout
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
