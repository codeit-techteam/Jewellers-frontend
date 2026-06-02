import { DiamondIcon } from '@components/ui/DiamondIcon';
import { StorefrontProductCard } from '@components/storefront/StorefrontProductCard';
import { colors } from '@constants/colors';
import {
  STOREFRONT_ABOUT_BODY,
  STOREFRONT_CATEGORIES,
  STOREFRONT_ESTABLISHED_LABEL,
  STOREFRONT_RATING_LABEL,
  STOREFRONT_TRUST_BADGES,
  STOREFRONT_VISIT_HOURS,
  type StorefrontCategoryTab,
} from '@constants/storeApp';
import { getProducts, trackEvent } from '@services/inventoryService';
import { recordStoreVisit } from '@services/publicAnalyticsService';
import { getStore } from '@services/storeService';
import type { InventoryProduct } from '@/types/inventory';
import { useProfileStore } from '@store/useProfileStore';
import {
  buildStorefrontInventoryProducts,
  type StorefrontDisplayProduct,
} from '@utils/buildStorefrontInventoryProducts';
import { matchesCategoryFilter } from '@utils/filterProductsByCategory';
import { handleApiError } from '@utils/handleApiError';
import { dialog } from '@utils/dialog';
import { showShareComingSoonAlert } from '@utils/storeAlerts';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function isTrackableInventoryId(id: string): boolean {
  // Mock/filler storefront products use 'mock-' prefix; real inventory products are UUIDs
  return !id.startsWith('mock-');
}

export default function StorefrontScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;
  const button = width * 0.042;
  const productNameSize = width * 0.036;

  const profile = useProfileStore((state) => state.profile);
  const applyStoreProfile = useProfileStore((state) => state.applyStoreProfile);

  const storeQuery = useQuery({
    queryKey: ['store'],
    queryFn: getStore,
  });

  const store = storeQuery.data;
  const storeName = store?.businessName ?? profile.businessName ?? 'Your Store';
  const logoUri = store?.logoUrl ?? profile.logoUri ?? null;
  const coverUri = store?.coverImageUrl ?? profile.coverUri ?? null;
  const tagline = store?.tagline ?? '';
  const aboutText =
    store?.description || store?.tagline || STOREFRONT_ABOUT_BODY;
  const visitAddress = store?.address || profile.address;
  const storeLocality = store?.locality ?? '';
  const visitHours =
    store?.openingTime && store?.closingTime
      ? `${store.openingTime} – ${store.closingTime}`
      : STOREFRONT_VISIT_HOURS;
  const workingDaysText = (() => {
    const days = store?.workingDays ?? [];
    if (days.length === 0) return '';
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sorted = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (sorted.length === 7) return 'Mon – Sun';
    return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
  })();

  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);

  useEffect(() => {
    if (store) {
      applyStoreProfile(store);
    }
  }, [store, applyStoreProfile]);

  // Partner preview — excluded from jeweller Unique Visitors metrics
  useEffect(() => {
    if (!store?.id) return;
    recordStoreVisit(store.id, { source: 'partner_preview' });
  }, [store?.id]);

  useEffect(() => {
    void (async () => {
      try {
        const products = await getProducts({ status: 'active', is_draft: false });
        setInventoryProducts(products);
      } catch (err) {
        handleApiError(err);
        setInventoryProducts([]);
      }
    })();
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<StorefrontCategoryTab>(
    STOREFRONT_CATEGORIES[0],
  );

  const displayProducts = useMemo(
    () => buildStorefrontInventoryProducts(inventoryProducts),
    [inventoryProducts],
  );

  const filteredProducts = useMemo(
    () =>
      displayProducts.filter((product) =>
        matchesCategoryFilter(product, selectedCategory),
      ),
    [displayProducts, selectedCategory],
  );

  const handleMap = () => {
    const encoded = encodeURIComponent(visitAddress);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  };

  const handleViewDetails = useCallback(
    (product: StorefrontDisplayProduct) => {
      if (!isTrackableInventoryId(product.id)) {
        void dialog.alert('Preview product', 'Add this product to your inventory to view full details.');
        return;
      }
      void trackEvent(product.id, 'view', { source: 'partner_preview' });
      router.push({
        pathname: '/(app)/product-detail',
        params: {
          productId: product.id,
          ...(returnTo ? { returnTo } : {}),
        },
      });
    },
    [returnTo, router],
  );

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <View className="flex-row items-center px-4">
        <Pressable
          onPress={() => navigateBack(router, returnTo)}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY }}
          numberOfLines={1}
        >
          {storeName}
        </Text>
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.push('/(app)/business-profile')}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="create-outline" size={width * 0.05} color={colors.NAVY} />
          </Pressable>
          <Pressable onPress={showShareComingSoonAlert} className="h-10 w-10 items-center justify-center">
            <Ionicons name="share-outline" size={width * 0.05} color={colors.NAVY} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {coverUri ? (
          <View className="mx-4 mt-4 overflow-hidden rounded-xl" style={{ height: width * 0.4 }}>
            <ImageBackground
              source={{ uri: coverUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        ) : null}

        <View
          className="mx-4 mt-4 rounded-xl border p-4"
          style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
        >
          <View className="items-center">
            <View className="relative">
              <View
                className="items-center justify-center overflow-hidden rounded-full border"
                style={{
                  width: 80,
                  height: 80,
                  borderColor: colors.BORDER,
                  backgroundColor: colors.SURFACE_MUTED,
                }}
              >
                {logoUri ? (
                  <Image
                    source={{ uri: logoUri }}
                    style={{ width: 80, height: 80 }}
                    resizeMode="cover"
                  />
                ) : (
                  <DiamondIcon
                    size={width * 0.07}
                    containerSize={64}
                    containerColor={colors.SURFACE_MUTED}
                    color={colors.GOLD}
                  />
                )}
              </View>
              <View
                className="absolute -bottom-1 -right-1 items-center justify-center rounded-full"
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: colors.NAVY,
                }}
              >
                <Ionicons name="checkmark" size={14} color={colors.WHITE} />
              </View>
            </View>
            <Text className="mt-3 text-center font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
              {storeName}
            </Text>
            {storeLocality ? (
              <Text className="mt-1 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                📍 {storeLocality}
              </Text>
            ) : null}
            <Text className="mt-2 text-center" style={{ fontSize: label, color: colors.BODY_TEXT }}>
              ⭐ {STOREFRONT_RATING_LABEL} • {STOREFRONT_ESTABLISHED_LABEL}
            </Text>
          </View>

        </View>

        <View style={{ flexGrow: 0, marginTop: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            nestedScrollEnabled
            contentContainerStyle={{
              paddingHorizontal: 16,
              alignItems: 'center',
              flexDirection: 'row',
              gap: width * 0.06,
            }}
          >
            {STOREFRONT_CATEGORIES.map((category) => {
              const isActive = category === selectedCategory;
              return (
                <Pressable key={category} onPress={() => setSelectedCategory(category)}>
                  <Text
                    className="font-semibold"
                    style={{
                      fontSize: body,
                      color: isActive ? colors.NAVY : colors.BODY_TEXT,
                    }}
                  >
                    {category}
                  </Text>
                  {isActive ? (
                    <View
                      className="mt-1 h-0.5 rounded-full"
                      style={{ backgroundColor: colors.NAVY }}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="mt-5 flex-row items-center justify-between px-4">
          <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
            New Arrivals
          </Text>
          <Pressable
            onPress={() => router.push('/(app)/inventory')}
          >
            <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
              SEE ALL
            </Text>
          </Pressable>
        </View>

        {filteredProducts.length === 0 ? (
          <Text
            className="mt-8 text-center"
            style={{ fontSize: body, color: colors.BODY_TEXT }}
          >
            No products in this category yet.
          </Text>
        ) : (
          <View className="mt-3 flex-row flex-wrap justify-between px-4">
            {filteredProducts.map((product) => (
              <StorefrontProductCard
                key={product.id}
                product={product}
                width={width}
                nameSize={productNameSize}
                label={label}
                onViewDetails={() => handleViewDetails(product)}
              />
            ))}
          </View>
        )}

        <View
          className="mx-4 mt-6 rounded-xl border p-4"
          style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
        >
          <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
            About {storeName}
          </Text>
          <Text className="mt-3 leading-relaxed" style={{ fontSize: body, color: colors.BODY_TEXT }}>
            {aboutText}
          </Text>
          <View className="mt-4 flex-row flex-wrap justify-between">
            {STOREFRONT_TRUST_BADGES.map((badge) => (
              <View key={badge.id} className="mb-4 flex-row items-center" style={{ width: '48%' }}>
                <View
                  className="mr-2 items-center justify-center rounded-full"
                  style={{
                    width: width * 0.09,
                    height: width * 0.09,
                    backgroundColor: colors.INFO_BG,
                  }}
                >
                  <Ionicons name={badge.icon} size={width * 0.045} color={colors.NAVY} />
                </View>
                <View className="flex-1">
                  <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{badge.label}</Text>
                  <Text className="font-bold" style={{ fontSize: label, color: colors.NAVY }}>
                    {badge.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-4 mt-6">
          <Text className="mb-3 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
            Visit Our Store
          </Text>
          <View className="overflow-hidden rounded-xl border" style={{ borderColor: colors.BORDER }}>
            <View
              className="items-center justify-center"
              style={{ height: 140, backgroundColor: colors.SURFACE_MUTED }}
            >
              <Ionicons name="location-outline" size={40} color={colors.BODY_TEXT} />
            </View>
            <View
              className="flex-row items-center justify-between border-t px-3 py-3"
              style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
            >
              <View className="flex-1 pr-2">
                <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                  {visitAddress}
                </Text>
                <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                  {visitHours}
                  {workingDaysText ? `  ·  ${workingDaysText}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={handleMap}
                className="rounded-lg px-3 py-2"
                style={{ backgroundColor: colors.NAVY }}
              >
                <Text className="font-semibold" style={{ fontSize: micro, color: colors.WHITE }}>
                  NAVIGATE
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="mx-4 mt-6">
          <Pressable
            onPress={() => router.replace('/(app)')}
            className="items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: colors.NAVY }}
          >
            <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
              Go to Dashboard
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
