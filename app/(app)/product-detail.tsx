import { DiamondIcon } from '@components/ui/DiamondIcon';
import { colors } from '@constants/colors';
import { getProduct, removeProductApi } from '@services/inventoryService';
import type { InventoryProduct } from '@/types/inventory';
import { useInventoryStore } from '@store/useInventoryStore';
import { inventoryQueryKeys } from '@lib/inventoryQueryKeys';
import { formatInr } from '@utils/formatCurrency';
import { handleApiError } from '@utils/handleApiError';
import { dialog } from '@utils/dialog';
import { showShareComingSoonAlert } from '@utils/storeAlerts';
import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { productId, returnTo } = useLocalSearchParams<{
    productId: string;
    returnTo?: string;
  }>();

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;
  const button = width * 0.042;

  const queryClient = useQueryClient();
  const storeProduct = useInventoryStore((state) =>
    productId ? state.products.find((item) => item.id === productId) : undefined,
  );
  const removeProduct = useInventoryStore((state) => state.removeProduct);

  const [product, setProduct] = useState<InventoryProduct | undefined>(storeProduct);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProduct = async () => {
    if (!productId) return;
    setLoadError(null);
    try {
      const fetched = await getProduct(productId);
      setProduct(fetched);
    } catch (err) {
      setLoadError(handleApiError(err));
    }
  };

  useEffect(() => {
    if (!productId) {
      navigateBack(router, returnTo);
      return;
    }
    // Always fetch fresh data to get all enrichment fields
    void loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (product?.availableSizes?.length) {
      setSelectedSize(product.availableSizes[0]);
    }
    if (product?.availableMetals?.length) {
      setSelectedMetal(product.availableMetals[0]);
    }
  }, [product]);

  if (!productId) return null;
  if (loadError && !product) {
    return <ErrorScreen message={loadError} onRetry={() => void loadProduct()} />;
  }
  if (!product) return <LoadingScreen message="Loading product…" />;

  const makingLabel =
    product.makingChargesType === 'percentage'
      ? `${product.makingChargesValue}%`
      : formatInr(product.makingChargesValue);

  const images =
    product.imageUris && product.imageUris.length > 0
      ? product.imageUris
      : product.imageUri
        ? [product.imageUri]
        : [];

  const descText = (product.description || product.additionalDetails)?.trim() ?? '';

  const tagPills = [product.gender, product.occasion, product.style].filter(Boolean) as string[];

  const specsEntries = product.specifications
    ? ([
        ['Metal', product.specifications.metal],
        ['Weight', product.specifications.weight],
        ['Carat', product.specifications.carat],
        ['Dimensions', product.specifications.dimensions],
        ['Certification', product.specifications.certification],
      ] as [string, string | undefined][]).filter(([, v]) => Boolean(v))
    : [];

  const pbRows =
    product.priceBreakup
      ? ([
          ['Gold / Metal', product.priceBreakup.gold],
          product.priceBreakup.gemstone > 0 ? ['Gemstone', product.priceBreakup.gemstone] : null,
          ['Making Charges', product.priceBreakup.makingCharge],
          ['GST', product.priceBreakup.gst],
        ] as ([string, number] | null)[]).filter(Boolean) as [string, number][]
      : [];

  const statItems = [
    { label: 'Views', value: product.analytics.views },
    { label: 'Wishlist', value: product.analytics.wishlist },
    { label: 'Inquiry', value: product.analytics.inquiry },
    { label: 'WA Click', value: product.analytics.waClicks },
  ];

  const handleEdit = () => {
    router.push({
      pathname: '/(app)/inventory/edit',
      params: { productId, returnTo },
    });
  };

  const handleDelete = () => {
    void dialog.confirm(
      `Delete "${product.name}"?`,
      'This will permanently remove the product from your store. This cannot be undone.',
      {
        destructive: true,
        confirmText: 'Delete',
        onConfirm: async () => {
          setIsDeleting(true);
          try {
            await removeProductApi(product.id);
            removeProduct(product.id);
            void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
            navigateBack(router, returnTo);
          } catch (err) {
            void dialog.alert('Error', handleApiError(err));
          } finally {
            setIsDeleting(false);
          }
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
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
          {product.name}
        </Text>
        <View className="flex-row items-center">
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(app)/inventory/edit', params: { productId } })
            }
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="create-outline" size={width * 0.05} color={colors.NAVY} />
          </Pressable>
          <Pressable
            onPress={showShareComingSoonAlert}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="share-outline" size={width * 0.055} color={colors.NAVY} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SECTION: Image gallery ── */}
        <View style={{ height: width * 0.85 }}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveImg(idx);
              }}
              style={{ flex: 1 }}
            >
              {images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{ width, height: width * 0.85 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View
              className="items-center justify-center"
              style={{ flex: 1, backgroundColor: colors.SURFACE_MUTED }}
            >
              <DiamondIcon
                size={width * 0.12}
                containerSize={width * 0.22}
                containerColor={colors.SURFACE_MUTED}
                color={colors.BODY_TEXT}
              />
            </View>
          )}
        </View>

        {/* Image dots */}
        {images.length > 1 ? (
          <View className="flex-row items-center justify-center" style={{ gap: 6, marginTop: 8 }}>
            {images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === activeImg ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === activeImg ? colors.NAVY : colors.BORDER,
                }}
              />
            ))}
          </View>
        ) : null}

        {/* ── Content card ── */}
        <View className="rounded-t-3xl bg-white px-5 pb-6 pt-5" style={{ marginTop: images.length > 1 ? 4 : -24 }}>

          {/* ── Basic Info ── */}
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 pr-2 font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
              {product.name}
            </Text>
            <View className="items-end">
              <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
                {formatInr(product.price)}
              </Text>
              {product.discountPercent && product.discountPercent > 0 ? (
                <View
                  className="mt-1 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: colors.GOLD }}
                >
                  <Text style={{ fontSize: micro, color: colors.WHITE, fontWeight: '600' }}>
                    {product.discountPercent}% OFF Making
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text className="mt-1" style={{ fontSize: label, color: colors.BODY_TEXT }}>
            SKU: {product.sku}
          </Text>

          {/* Property pills */}
          <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
            {[`${product.weight}g`, product.purity, product.category]
              .filter(Boolean)
              .map((pill) => (
                <View
                  key={pill}
                  className="rounded-lg px-3 py-2"
                  style={{ backgroundColor: colors.SURFACE_MUTED }}
                >
                  <Text style={{ fontSize: label, color: colors.NAVY }}>{pill}</Text>
                </View>
              ))}
          </View>
          <Text className="mt-2" style={{ fontSize: label, color: colors.BODY_TEXT }}>
            Making Charges: {makingLabel}
          </Text>

          {/* ── Tags ── */}
          {tagPills.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap items-center" style={{ gap: 6 }}>
              {tagPills.map((tag, i) => (
                <View key={tag} className="flex-row items-center">
                  {i > 0 ? (
                    <Text style={{ fontSize: micro, color: colors.BORDER, marginRight: 6 }}>•</Text>
                  ) : null}
                  <View
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: colors.INFO_BG }}
                  >
                    <Text style={{ fontSize: micro, color: colors.NAVY, fontWeight: '500' }}>
                      {tag}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* ── Collection name ── */}
          {product.collectionName ? (
            <View
              className="mt-3 flex-row items-center rounded-lg px-3 py-2"
              style={{ backgroundColor: colors.TIP_BG, borderColor: colors.TIP_BORDER, borderWidth: 1 }}
            >
              <Ionicons name="albums-outline" size={14} color={colors.GOLD} />
              <Text className="ml-2" style={{ fontSize: label, color: colors.NAVY }}>
                Part of{' '}
                <Text className="font-semibold">{product.collectionName}</Text>
              </Text>
            </View>
          ) : null}

          <View className="my-4 h-px" style={{ backgroundColor: colors.BORDER }} />

          {/* ── Available Sizes ── */}
          {product.availableSizes && product.availableSizes.length > 0 ? (
            <View className="mb-4">
              <Text className="mb-2 font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
                Size
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {product.availableSizes.map((sz) => {
                  const active = selectedSize === sz;
                  return (
                    <Pressable
                      key={sz}
                      onPress={() => setSelectedSize(sz)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: active ? colors.NAVY : colors.WHITE,
                        borderWidth: 1,
                        borderColor: active ? colors.NAVY : colors.BORDER,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: label,
                          color: active ? colors.WHITE : colors.NAVY,
                          fontWeight: active ? '600' : '400',
                        }}
                      >
                        {sz}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ── Available Metals ── */}
          {product.availableMetals && product.availableMetals.length > 0 ? (
            <View className="mb-4">
              <Text className="mb-2 font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
                Metal
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {product.availableMetals.map((metal) => {
                  const active = selectedMetal === metal;
                  return (
                    <Pressable
                      key={metal}
                      onPress={() => setSelectedMetal(metal)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: active ? colors.NAVY : colors.WHITE,
                        borderWidth: 1,
                        borderColor: active ? colors.NAVY : colors.BORDER,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: label,
                          color: active ? colors.WHITE : colors.NAVY,
                          fontWeight: active ? '600' : '400',
                        }}
                      >
                        {metal}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ── Description ── */}
          {descText ? (
            <View className="mb-4">
              <Text className="mb-2 font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
                Description
              </Text>
              <Text
                numberOfLines={descExpanded ? undefined : 3}
                style={{ fontSize: body, color: colors.BODY_TEXT, lineHeight: body * 1.55 }}
              >
                {descText}
              </Text>
              {descText.length > 120 ? (
                <Pressable onPress={() => setDescExpanded((v) => !v)} className="mt-1">
                  <Text style={{ fontSize: label, color: colors.NAVY, fontWeight: '600' }}>
                    {descExpanded ? 'Read less' : 'Read more'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* ── Price Breakup ── */}
          {product.priceBreakup && pbRows.length > 0 ? (
            <View
              className="mb-4 rounded-xl p-4"
              style={{ backgroundColor: colors.SURFACE_MUTED }}
            >
              <Text className="mb-3 font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
                Price Breakup
              </Text>
              {pbRows.map(([rowLabel, val]) => (
                <View
                  key={rowLabel}
                  className="flex-row items-center justify-between border-b py-2"
                  style={{ borderColor: colors.BORDER }}
                >
                  <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>{rowLabel}</Text>
                  <Text style={{ fontSize: label, color: colors.NAVY }}>
                    {formatInr(val)}
                  </Text>
                </View>
              ))}
              <View className="flex-row items-center justify-between pt-2">
                <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                  Total
                </Text>
                <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                  {formatInr(product.priceBreakup.total)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── Specifications ── */}
          {specsEntries.length > 0 ? (
            <View className="mb-4">
              <Text className="mb-3 font-semibold" style={{ fontSize: body, color: colors.NAVY }}>
                Specifications
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {specsEntries.map(([specLabel, val]) => (
                  <View
                    key={specLabel}
                    className="rounded-xl p-3"
                    style={{
                      width: '47%',
                      backgroundColor: colors.SURFACE_MUTED,
                    }}
                  >
                    <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{specLabel}</Text>
                    <Text
                      className="mt-1 font-semibold"
                      style={{ fontSize: label, color: colors.NAVY }}
                      numberOfLines={2}
                    >
                      {val}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View className="h-px" style={{ backgroundColor: colors.BORDER }} />

          {/* ── Product Insights (Analytics) ── */}
          <View
            className="mt-4 rounded-xl p-3"
            style={{ backgroundColor: colors.SURFACE_MUTED }}
          >
            <Text
              className="mb-2 uppercase tracking-wider"
              style={{ fontSize: micro, color: colors.BODY_TEXT }}
            >
              Product Insights
            </Text>
            <View className="flex-row">
              {statItems.map((stat) => (
                <View key={stat.label} className="flex-1 items-center">
                  <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{stat.label}</Text>
                  <Text className="font-bold" style={{ fontSize: label, color: colors.NAVY }}>
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Manage Product ── */}
          <Text
            className="mb-3 mt-5 font-bold uppercase tracking-wider"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            Manage Product
          </Text>

          <Pressable
            onPress={handleEdit}
            className="mb-3 flex-row items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: colors.NAVY }}
          >
            <Ionicons name="pencil" size={width * 0.045} color={colors.WHITE} />
            <Text className="ml-2 font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
              Edit Product
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            className="flex-row items-center justify-center rounded-xl border py-4"
            style={{ borderColor: colors.ERROR, opacity: isDeleting ? 0.6 : 1 }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.ERROR} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={width * 0.045} color={colors.ERROR} />
                <Text className="ml-2 font-semibold" style={{ fontSize: button, color: colors.ERROR }}>
                  Delete Product
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
