import { DiamondIcon } from '@components/ui/DiamondIcon';
import { colors } from '@constants/colors';
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_WHATSAPP,
} from '@constants/profile';
import { getStore, updateCover, updateLogo } from '@services/storeService';
import type { BusinessDocument } from '@/types/profile';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '@utils/handleApiError';
import { dialog } from '@utils/dialog';
import { useAuthStore } from '@store/useAuthStore';
import { useProfileStore } from '@store/useProfileStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RETURN_TO_PROFILE } from '@lib/navigateBack';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
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

  const queryClient = useQueryClient();
  const profile = useProfileStore((state) => state.profile);
  const documents = useProfileStore((state) => state.documents);
  const applyStoreProfile = useProfileStore((state) => state.applyStoreProfile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);

  // SUBSCRIPTION DISABLED - enable in future
  // const planName = profile.plan ?? 'Free Plan';
  // const isPaidPlan = planName.toLowerCase() !== 'free' && planName.toLowerCase() !== 'free plan';

  const storeQuery = useQuery({
    queryKey: ['store'],
    queryFn: getStore,
  });

  useEffect(() => {
    if (storeQuery.data) {
      applyStoreProfile(storeQuery.data);
    }
  }, [storeQuery.data, applyStoreProfile]);

  const handleLogoPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      void dialog.alert('Permission required', 'Photo library access is needed to update your logo.');
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

    const localUri = result.assets[0].uri;
    try {
      const logoUrl = await updateLogo(localUri);
      updateProfile({ logoUri: logoUrl });
      void queryClient.invalidateQueries({ queryKey: ['store'] });
    } catch (err) {
      void dialog.alert('Upload failed', handleApiError(err));
    }
  };

  const handleCoverPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      void dialog.alert('Permission required', 'Photo library access is needed to update your cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const localUri = result.assets[0].uri;
    try {
      const coverUrl = await updateCover(localUri);
      updateProfile({ coverUri: coverUrl });
      void queryClient.invalidateQueries({ queryKey: ['store'] });
    } catch (err) {
      void dialog.alert('Upload failed', handleApiError(err));
    }
  };

  const gstDoc = documents.find((d) => d.type === 'gst');
  const bisDoc = documents.find((d) => d.type === 'bis');

  const docStatusLabel = (doc: BusinessDocument | undefined) => {
    if (!doc) return 'Not uploaded';
    return doc.updatedAt;
  };

  // If the store is admin-approved, GST & BIS are implicitly verified (admin reviewed them).
  const storeApproved = profile.isVerified;

  const docBadge = (doc: BusinessDocument | undefined, isComplianceDoc = false) => {
    if (!doc) {
      return (
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.SURFACE_MUTED }}>
          <Text style={{ fontSize: micro, color: colors.BODY_TEXT, fontWeight: '700' }}>MISSING</Text>
        </View>
      );
    }
    // Store approval implies admin has reviewed GST and BIS docs
    const effectiveStatus = storeApproved && isComplianceDoc ? 'verified' : doc.status;
    if (effectiveStatus === 'verified') {
      return (
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${colors.SUCCESS}22` }}>
          <Text style={{ fontSize: micro, color: colors.SUCCESS, fontWeight: '700' }}>VERIFIED</Text>
        </View>
      );
    }
    if (effectiveStatus === 'expiring') {
      return (
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.TIP_BG }}>
          <Text style={{ fontSize: micro, color: colors.GOLD, fontWeight: '700' }}>EXPIRING SOON</Text>
        </View>
      );
    }
    if (effectiveStatus === 'expired') {
      return (
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${colors.ERROR}22` }}>
          <Text style={{ fontSize: micro, color: colors.ERROR, fontWeight: '700' }}>EXPIRED</Text>
        </View>
      );
    }
    return (
      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.SURFACE_MUTED }}>
        <Text style={{ fontSize: micro, color: colors.BODY_TEXT, fontWeight: '700' }}>PENDING</Text>
      </View>
    );
  };

  const openWhatsApp = () =>
    void Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}?text=Hi%2C%20I%20need%20help%20with%20my%20Jewellars%20account.`);
  const openCall = () => void Linking.openURL(`tel:${SUPPORT_PHONE}`);
  const openEmail = () =>
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support%20Request%20-%20Jewellars%20App`);

  const handleOpenMaps = () => {
    const encoded = encodeURIComponent(profile.address);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  };

  const handleLogout = () => {
    void dialog.confirm('Logout', 'Are you sure you want to logout?', {
      destructive: true,
      confirmText: 'Logout',
      onConfirm: async () => {
        await logout();
        queryClient.clear();
        router.replace('/');
      },
    });
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <Text className="mb-4 text-center font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
        Profile Settings
      </Text>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => void handleCoverPick()} className="relative overflow-hidden">
          {profile.coverUri ? (
            <ImageBackground
              source={{ uri: profile.coverUri }}
              style={{ width: '100%', height: width * 0.36 }}
              resizeMode="cover"
            >
              <View
                className="absolute bottom-3 right-3 flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: colors.OVERLAY_DARK }}
              >
                <Ionicons name="camera" size={14} color={colors.WHITE} />
                <Text className="ml-1 font-semibold" style={{ fontSize: micro, color: colors.WHITE }}>
                  Edit cover
                </Text>
              </View>
            </ImageBackground>
          ) : (
            <View
              className="items-center justify-center"
              style={{ width: '100%', height: width * 0.36, backgroundColor: colors.NAVY }}
            >
              <Ionicons name="image-outline" size={32} color={colors.WHITE} />
              <Text className="mt-2 font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
                Add cover image
              </Text>
            </View>
          )}
        </Pressable>

        {storeQuery.isPending && !storeQuery.data ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color={colors.NAVY} />
          </View>
        ) : null}

        <View className="px-5">
        <Pressable onPress={() => void handleLogoPick()} className="-mt-10 items-center">
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
        {profile.isVerified ? (
          <View className="mt-2 flex-row items-center justify-center">
            <Ionicons name="checkmark-circle" size={16} color={colors.NAVY} />
            <Text className="ml-1 font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
              Verified B2B Member
            </Text>
          </View>
        ) : null}
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
            icon="location-outline"
            label="Business Address"
            subtitle={profile.address}
            onPress={handleOpenMaps}
            body={body}
            micro={micro}
          />
          {/* SUBSCRIPTION DISABLED - enable in future
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
          */}
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
            subtitle={docStatusLabel(gstDoc)}
            onPress={() => {}}
            body={body}
            micro={micro}
            rightElement={docBadge(gstDoc, true)}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="BIS License"
            subtitle={
              bisDoc?.licenseNo ? `License No: ${bisDoc.licenseNo}` : docStatusLabel(bisDoc)
            }
            onPress={() => {}}
            body={body}
            micro={micro}
            isLast
            rightElement={docBadge(bisDoc, true)}
          />
        </View>

        {/* ── Support & Help ── */}
        <Text
          className="mb-2 mt-6 uppercase tracking-wider"
          style={{ fontSize: micro, color: colors.BODY_TEXT }}
        >
          Support & Help
        </Text>
        <View className="overflow-hidden rounded-xl border" style={{ borderColor: colors.BORDER }}>
          {/* WhatsApp */}
          <Pressable
            onPress={openWhatsApp}
            className="flex-row items-center px-4 py-4"
            style={{ borderBottomWidth: 1, borderBottomColor: colors.BORDER }}
          >
            <View
              className="mr-3 items-center justify-center rounded-lg"
              style={{ width: 36, height: 36, backgroundColor: '#DCFCE7' }}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                WhatsApp Support
              </Text>
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                Chat with us — fastest response
              </Text>
            </View>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: '#DCFCE7' }}
            >
              <Text style={{ fontSize: micro, color: '#16A34A', fontWeight: '700' }}>FAST</Text>
            </View>
          </Pressable>

          {/* Call */}
          <Pressable
            onPress={openCall}
            className="flex-row items-center px-4 py-4"
            style={{ borderBottomWidth: 1, borderBottomColor: colors.BORDER }}
          >
            <View
              className="mr-3 items-center justify-center rounded-lg"
              style={{ width: 36, height: 36, backgroundColor: colors.INFO_BG }}
            >
              <Ionicons name="call-outline" size={20} color={colors.NAVY} />
            </View>
            <View className="flex-1">
              <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                Call Support
              </Text>
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{SUPPORT_PHONE}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.BODY_TEXT} />
          </Pressable>

          {/* Email */}
          <Pressable
            onPress={openEmail}
            className="flex-row items-center px-4 py-4"
          >
            <View
              className="mr-3 items-center justify-center rounded-lg"
              style={{ width: 36, height: 36, backgroundColor: colors.INFO_BG }}
            >
              <Ionicons name="mail-outline" size={20} color={colors.NAVY} />
            </View>
            <View className="flex-1">
              <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                Email Support
              </Text>
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.BODY_TEXT} />
          </Pressable>
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
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
