import { DiamondIcon } from '@components/ui/DiamondIcon';
import { pickImageFromLibrary } from '@components/ui/DocumentUploader';
import { colors } from '@constants/colors';
import { PROFILE_TAGLINE } from '@constants/profile';
import { getStore, updateLogo, updateStore } from '@services/storeService';
import { useProfileStore } from '@store/useProfileStore';
import { businessProfileSchema, type BusinessProfileFormValues } from '@utils/businessProfileFormSchema';
import { handleApiError } from '@utils/handleApiError';
import { api } from '@services/api';
import { Ionicons } from '@expo/vector-icons';
import { usePullToRefreshCallback } from '@hooks/usePullToRefresh';
import { zodResolver } from '@hookform/resolvers/zod';
import { navigateBack } from '@lib/navigateBack';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type FieldRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
  hasError?: boolean;
  alignTop?: boolean;
};

function FieldRow({ icon, children, hasError = false, alignTop = false }: FieldRowProps) {
  return (
    <View
      className="mb-3 flex-row rounded-xl border px-3"
      style={{
        borderColor: hasError ? colors.ERROR : colors.BORDER,
        backgroundColor: colors.WHITE,
        minHeight: 52,
        alignItems: alignTop ? 'flex-start' : 'center',
        paddingTop: alignTop ? 12 : 0,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.NAVY} style={alignTop ? { marginTop: 2 } : undefined} />
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
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [descLength, setDescLength] = useState(0);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: profile.businessName,
      ownerName: profile.ownerName,
      phone: profile.phone.replace(/^\+91\s?/, ''),
      whatsappNumber: '',
      address: profile.address,
      taxId: profile.taxId,
      description: '',
      locality: '',
      openingTime: '',
      closingTime: '',
    },
  });

  const loadStoreProfile = useCallback(
    async (options?: { showFullScreenLoader?: boolean }) => {
      if (options?.showFullScreenLoader !== false) {
        setIsLoading(true);
      }
      try {
        const store = await getStore();
        applyStoreProfile(store);
        setWorkingDays(store.workingDays ?? []);
        setDescLength((store.description ?? '').length);
        reset({
          businessName: store.businessName,
          ownerName: store.ownerName,
          phone: store.phone.replace(/^\+91\s?/, '').replace(/\D/g, '').slice(-10),
          whatsappNumber: store.whatsappNumber
            ? store.whatsappNumber.replace(/^\+91\s?/, '').replace(/\D/g, '').slice(-10)
            : '',
          address: store.address,
          taxId: store.documents.find((d) => d.type === 'gst')?.licenseNo ?? profile.taxId,
          description: store.description ?? '',
          locality: store.locality ?? '',
          openingTime: store.openingTime ?? '',
          closingTime: store.closingTime ?? '',
        });
      } catch (err) {
        setLoadError(handleApiError(err));
      } finally {
        if (options?.showFullScreenLoader !== false) {
          setIsLoading(false);
        }
      }
    },
    [applyStoreProfile, profile.taxId, reset],
  );

  const { isRefreshing: isBusinessProfileRefreshing, onRefresh: onBusinessProfileRefresh } =
    usePullToRefreshCallback(() => loadStoreProfile({ showFullScreenLoader: false }));

  useEffect(() => {
    void loadStoreProfile({ showFullScreenLoader: true });
  }, [loadStoreProfile]);

  const handleUseCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadError('Please enable location permission to use this feature.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      type GeocodeResponse = {
        formatted_address: string | null;
        locality: string | null;
        city: string | null;
        lat: number;
        lng: number;
      };

      const { data } = await api.get<GeocodeResponse>('/api/jeweller/utils/geocode', {
        params: { lat: latitude, lng: longitude },
      });

      if (!data.formatted_address) {
        setLoadError('Could not fetch location. Please enter manually.');
        return;
      }

      setValue('address', data.formatted_address);
      if (data.locality) {
        setValue('locality', data.locality);
      }
      setLoadError(null);
    } catch {
      setLoadError('Could not fetch location. Please enter manually.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

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

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const onSubmit = async (values: BusinessProfileFormValues) => {
    setIsSaving(true);
    setLoadError(null);
    try {
      const phoneDigits = values.phone.replace(/\D/g, '').slice(-10);
      const waDigits = values.whatsappNumber?.replace(/\D/g, '').slice(-10);

      const store = await updateStore({
        name: values.businessName.trim(),
        address: values.address.trim(),
        locality: values.locality?.trim() || undefined,
        description: values.description?.trim() || undefined,
        phoneNumber: phoneDigits,
        whatsappNumber: waDigits || phoneDigits,
        openingTime: values.openingTime?.trim() || undefined,
        closingTime: values.closingTime?.trim() || undefined,
        workingDays: workingDays.length > 0 ? workingDays : undefined,
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

  const descValue = watch('description') ?? '';

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
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isBusinessProfileRefreshing}
              onRefresh={onBusinessProfileRefresh}
              tintColor={colors.NAVY}
            />
          }
        >
          {/* ── Logo ── */}
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
                style={{ width: 28, height: 28, backgroundColor: colors.NAVY }}
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

          {/* ── Business Identity ── */}
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

          {/* ── Store Details ── */}
          <Text
            className="mb-2 mt-4 uppercase tracking-wider"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            Store Details
          </Text>

          <View
            className="mb-3 rounded-xl border px-3 py-3"
            style={{
              borderColor: errors.description ? colors.ERROR : colors.BORDER,
              backgroundColor: colors.WHITE,
            }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="document-text-outline" size={20} color={colors.NAVY} />
              <Text className="ml-2 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
                Store Description
              </Text>
              <Text className="ml-auto" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                {descValue.length}/200
              </Text>
            </View>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={(t) => { onChange(t); setDescLength(t.length); }}
                  onBlur={onBlur}
                  placeholder="Tell customers about your store..."
                  placeholderTextColor={colors.BODY_TEXT}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  textAlignVertical="top"
                  style={{
                    fontSize: body,
                    color: colors.NAVY,
                    minHeight: 80,
                  }}
                />
              )}
            />
          </View>
          {errors.description ? (
            <Text style={{ fontSize: micro, color: colors.ERROR, marginBottom: 8 }}>
              {errors.description.message}
            </Text>
          ) : null}

          <FieldRow icon="location-outline" hasError={Boolean(errors.locality)}>
            <Controller
              control={control}
              name="locality"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Zaveri Bazaar, Mumbai"
                  placeholderTextColor={colors.BODY_TEXT}
                  style={{ fontSize: body, color: colors.NAVY, paddingVertical: 12 }}
                />
              )}
            />
          </FieldRow>

          {/* ── Contact Information ── */}
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

          <FieldRow icon="logo-whatsapp" hasError={Boolean(errors.whatsappNumber)}>
            <Controller
              control={control}
              name="whatsappNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  placeholder="WhatsApp number (leave blank to use phone)"
                  placeholderTextColor={colors.BODY_TEXT}
                  style={{ fontSize: body, color: colors.NAVY, paddingVertical: 12 }}
                />
              )}
            />
          </FieldRow>
          {errors.whatsappNumber ? (
            <Text style={{ fontSize: micro, color: colors.ERROR, marginBottom: 8 }}>
              {errors.whatsappNumber.message}
            </Text>
          ) : null}

          <FieldRow icon="location-outline" hasError={Boolean(errors.address)} alignTop>
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
          <View className="mb-3 flex-row items-center justify-end" style={{ marginTop: -6 }}>
            {isFetchingLocation ? (
              <ActivityIndicator size="small" color={colors.NAVY} style={{ marginRight: 8 }} />
            ) : null}
            <Pressable
              onPress={() => void handleUseCurrentLocation()}
              disabled={isFetchingLocation}
              hitSlop={8}
            >
              <Text
                style={{
                  fontSize: label,
                  color: isFetchingLocation ? colors.BODY_TEXT : colors.NAVY,
                  fontWeight: '600',
                }}
              >
                📍 Use Current Location
              </Text>
            </Pressable>
          </View>

          {/* ── Hours & Availability ── */}
          <Text
            className="mb-2 mt-2 uppercase tracking-wider"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            Hours & Availability
          </Text>

          <View className="mb-3 flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text className="mb-1 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
                Opening Time
              </Text>
              <View
                className="flex-row items-center rounded-xl border px-3"
                style={{ borderColor: errors.openingTime ? colors.ERROR : colors.BORDER, backgroundColor: colors.WHITE, height: 52 }}
              >
                <Ionicons name="time-outline" size={18} color={colors.NAVY} />
                <Controller
                  control={control}
                  name="openingTime"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="10:00"
                      placeholderTextColor={colors.BODY_TEXT}
                      keyboardType="numbers-and-punctuation"
                      style={{ flex: 1, fontSize: body, color: colors.NAVY, marginLeft: 8 }}
                    />
                  )}
                />
              </View>
              {errors.openingTime ? (
                <Text style={{ fontSize: micro, color: colors.ERROR }}>
                  {errors.openingTime.message}
                </Text>
              ) : null}
            </View>

            <View style={{ flex: 1 }}>
              <Text className="mb-1 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
                Closing Time
              </Text>
              <View
                className="flex-row items-center rounded-xl border px-3"
                style={{ borderColor: errors.closingTime ? colors.ERROR : colors.BORDER, backgroundColor: colors.WHITE, height: 52 }}
              >
                <Ionicons name="time-outline" size={18} color={colors.NAVY} />
                <Controller
                  control={control}
                  name="closingTime"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="20:00"
                      placeholderTextColor={colors.BODY_TEXT}
                      keyboardType="numbers-and-punctuation"
                      style={{ flex: 1, fontSize: body, color: colors.NAVY, marginLeft: 8 }}
                    />
                  )}
                />
              </View>
              {errors.closingTime ? (
                <Text style={{ fontSize: micro, color: colors.ERROR }}>
                  {errors.closingTime.message}
                </Text>
              ) : null}
            </View>
          </View>

          <Text className="mb-2 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
            Working Days
          </Text>
          <View className="mb-3 flex-row flex-wrap" style={{ gap: 8 }}>
            {ALL_DAYS.map((day) => {
              const active = workingDays.includes(day);
              return (
                <Pressable
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? colors.NAVY : colors.WHITE,
                    borderWidth: 1,
                    borderColor: active ? colors.NAVY : colors.BORDER,
                  }}
                >
                  <Text
                    style={{
                      fontSize: label,
                      color: active ? colors.WHITE : colors.BODY_TEXT,
                      fontWeight: active ? '600' : '400',
                    }}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Legal Information ── */}
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
