import { DiamondIcon } from '@components/ui/DiamondIcon';
import { pickImageFromLibrary } from '@components/ui/DocumentUploader';
import { colors } from '@constants/colors';
import { PROFILE_TAGLINE } from '@constants/profile';
import { getStore, updateLogo, updateStore } from '@services/storeService';
import { useProfileStore } from '@store/useProfileStore';
import { businessProfileSchema, type BusinessProfileFormValues } from '@utils/businessProfileFormSchema';
import { handleApiError } from '@utils/handleApiError';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FieldRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
  hasError?: boolean;
};

function FieldRow({ icon, children, hasError = false }: FieldRowProps) {
  return (
    <View
      className="mb-3 flex-row items-center rounded-xl border px-3"
      style={{
        borderColor: hasError ? colors.ERROR : colors.BORDER,
        backgroundColor: colors.WHITE,
        minHeight: 52,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.NAVY} />
      <View className="ml-2 flex-1">{children}</View>
    </View>
  );
}

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;
  const button = width * 0.042;

  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const applyStoreProfile = useProfileStore((state) => state.applyStoreProfile);
  const setIsLoading = useProfileStore((state) => state.setLoading);
  const isLoading = useProfileStore((state) => state.isLoading);

  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: profile.businessName,
      ownerName: profile.ownerName,
      phone: profile.phone.replace(/^\+91\s?/, ''),
      address: profile.address,
      taxId: profile.taxId,
    },
  });

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const store = await getStore();
        applyStoreProfile(store);
        reset({
          businessName: store.businessName,
          ownerName: store.ownerName,
          phone: store.phone.replace(/^\+91\s?/, '').replace(/\D/g, '').slice(-10),
          address: store.address,
          taxId: store.documents.find((d) => d.type === 'gst')?.licenseNo ?? profile.taxId,
        });
      } catch (err) {
        setLoadError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoPick = async () => {
    const picked = await pickImageFromLibrary();
    if (picked?.fileUri) {
      try {
        const logoUrl = await updateLogo(picked.fileUri);
        updateProfile({ logoUri: logoUrl });
      } catch (err) {
        setLoadError(handleApiError(err));
      }
    }
  };

  const onSubmit = async (values: BusinessProfileFormValues) => {
    setIsSaving(true);
    setLoadError(null);
    try {
      const phoneDigits = values.phone.replace(/\D/g, '').slice(-10);
      const store = await updateStore({
        name: values.businessName.trim(),
        address: values.address.trim(),
        phoneNumber: phoneDigits,
        whatsappNumber: phoneDigits,
      });
      applyStoreProfile(store);
      updateProfile({
        businessName: store.businessName,
        ownerName: store.ownerName,
        phone: store.phone,
        address: store.address,
        taxId: values.taxId.trim(),
        logoUri: store.logoUrl,
      });
      navigateBack(router, returnTo);
    } catch (err) {
      setLoadError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <View className="mb-2 flex-row items-center px-5">
        <Pressable onPress={() => navigateBack(router, returnTo)} className="py-2 pr-3">
          <Text style={{ fontSize: body, color: colors.NAVY }}>{'< Back'}</Text>
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY }}
        >
          Business Profile
        </Text>
        <View style={{ width: width * 0.16 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loadError ? (
          <Text className="px-5 pb-2" style={{ fontSize: micro, color: colors.ERROR }}>
            {loadError}
          </Text>
        ) : null}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center py-4">
            <Pressable onPress={() => void handleLogoPick()} className="relative">
              <View
                className="items-center justify-center overflow-hidden rounded-full border"
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
                className="absolute bottom-0 right-0 items-center justify-center rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: colors.NAVY,
                }}
              >
                <Ionicons name="camera" size={14} color={colors.WHITE} />
              </View>
            </Pressable>
            <Text className="mt-3 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
              {profile.businessName}
            </Text>
            <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{PROFILE_TAGLINE}</Text>
            <Pressable
              onPress={() => void handleLogoPick()}
              className="mt-3 rounded-full px-4 py-2"
              style={{ backgroundColor: colors.INFO_BG }}
            >
              <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
                Change Logo
              </Text>
            </Pressable>
          </View>

          <Text
            className="mb-2 uppercase tracking-wider"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            Business Identity
          </Text>
          <FieldRow icon="storefront-outline" hasError={Boolean(errors.businessName)}>
            <Controller
              control={control}
              name="businessName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={profile.businessName}
                  placeholderTextColor={colors.BODY_TEXT}
                  style={{ fontSize: body, color: colors.NAVY, paddingVertical: 12 }}
                />
              )}
            />
          </FieldRow>
          {errors.businessName ? (
            <Text style={{ fontSize: micro, color: colors.ERROR, marginBottom: 8 }}>
              {errors.businessName.message}
            </Text>
          ) : null}

          <FieldRow icon="person-outline" hasError={Boolean(errors.ownerName)}>
            <Controller
              control={control}
              name="ownerName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={profile.ownerName}
                  placeholderTextColor={colors.BODY_TEXT}
                  style={{ fontSize: body, color: colors.NAVY, paddingVertical: 12 }}
                />
              )}
            />
          </FieldRow>
          {errors.ownerName ? (
            <Text style={{ fontSize: micro, color: colors.ERROR, marginBottom: 8 }}>
              {errors.ownerName.message}
            </Text>
          ) : null}

          <Text
            className="mb-2 mt-2 uppercase tracking-wider"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            Contact Information
          </Text>
          <FieldRow icon="call-outline" hasError={Boolean(errors.phone)}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  placeholder={profile.phone}
                  placeholderTextColor={colors.BODY_TEXT}
                  style={{ fontSize: body, color: colors.NAVY, paddingVertical: 12 }}
                />
              )}
            />
          </FieldRow>
          {errors.phone ? (
            <Text style={{ fontSize: micro, color: colors.ERROR, marginBottom: 8 }}>
              {errors.phone.message}
            </Text>
          ) : null}

          <FieldRow icon="location-outline" hasError={Boolean(errors.address)}>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  placeholder={profile.address}
                  placeholderTextColor={colors.BODY_TEXT}
                  style={{
                    fontSize: body,
                    color: colors.NAVY,
                    paddingVertical: 12,
                    minHeight: 60,
                    textAlignVertical: 'top',
                  }}
                />
              )}
            />
          </FieldRow>
          {errors.address ? (
            <Text style={{ fontSize: micro, color: colors.ERROR, marginBottom: 8 }}>
              {errors.address.message}
            </Text>
          ) : null}

          <Text
            className="mb-2 mt-2 uppercase tracking-wider"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            Legal Information
          </Text>
          <FieldRow icon="document-text-outline" hasError={Boolean(errors.taxId)}>
            <Controller
              control={control}
              name="taxId"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={profile.taxId}
                  placeholderTextColor={colors.BODY_TEXT}
                  style={{ fontSize: body, color: colors.NAVY, paddingVertical: 12 }}
                />
              )}
            />
          </FieldRow>
          {errors.taxId ? (
            <Text style={{ fontSize: micro, color: colors.ERROR }}>{errors.taxId.message}</Text>
          ) : null}
        </ScrollView>

        <View
          className="border-t px-5 py-3"
          style={{ borderColor: colors.BORDER, paddingBottom: insets.bottom + 8 }}
        >
          <Pressable
            onPress={() => void handleSubmit(onSubmit)()}
            disabled={isSaving || isLoading}
            className="flex-row items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: colors.NAVY }}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.WHITE} />
            ) : (
              <>
                <Text style={{ fontSize: body, marginRight: 6 }}>💾</Text>
                <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
