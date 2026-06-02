import { CachedImage } from '@components/ui/CachedImage';
import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { colors } from '@constants/colors';
import { MIN_PRODUCTS_REQUIRED, PRODUCT_UPLOAD_BENEFITS } from '@constants/products';
import { useFontScale } from '@hooks/useFontScale';
import { useAsyncAction } from '@hooks/useAsyncAction';
import { handleApiError } from '@utils/handleApiError';
import { loadOnboardingMeta, saveOnboardingMeta } from '@lib/onboardingMeta';
import { submitForReview } from '@services/onboardingService';
import { getProducts, removeProductApi } from '@services/inventoryService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { InventoryProduct } from '@/types/inventory';
import { formatCategoryName } from '@utils/categoryLabel';
import { formatInr } from '@utils/formatCurrency';
import { dialog } from '@utils/dialog';
import { RETURN_TO_STEP5_PRODUCTS } from '@lib/navigateBack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Step5ProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, h1, h2, body, label, micro, button } = useFontScale();

  const setIsSubmitting = useOnboardingStore((state) => state.setIsSubmitting);
  const isSubmitting = useOnboardingStore((state) => state.isSubmitting);

  const { execute } = useAsyncAction();

  const handleBack = useCallback(() => {
    void dialog.confirm('Go Back?', 'Added products will be saved.', {
      confirmText: 'Go Back',
      onConfirm: () => router.replace('/(onboarding)/step4-branding'),
    });
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

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setApiError(null);
    try {
      // Fetch all products (active + draft) — during onboarding products are
      // saved as drafts and become active only after boutique approval.
      const fetched = await getProducts();
      setProducts(fetched);
    } catch (err) {
      setApiError(handleApiError(err));
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Re-fetch every time this screen comes into focus (i.e. after returning from add/edit)
  useFocusEffect(
    useCallback(() => {
      void fetchProducts();
    }, [fetchProducts]),
  );

  const addedCount = products.length;
  const remaining = Math.max(0, MIN_PRODUCTS_REQUIRED - addedCount);
  const progressPercent = Math.min(100, (addedCount / MIN_PRODUCTS_REQUIRED) * 100);
  const canLaunch = addedCount >= MIN_PRODUCTS_REQUIRED;

  const progressHint = canLaunch
    ? 'Minimum reached! Add more to strengthen your store.'
    : `Add ${remaining} more product${remaining === 1 ? '' : 's'} to continue`;

  const handleAddProduct = () => {
    router.push('/(onboarding)/add-product');
  };

  const handleEditProduct = (productId: string) => {
    router.push({
      pathname: '/(app)/inventory/edit',
      params: { productId, returnTo: RETURN_TO_STEP5_PRODUCTS },
    });
  };

  const handleDeleteProduct = (id: string, name: string) => {
    void dialog.confirm(`Remove "${name}"?`, 'This product will be deleted from your store.', {
      destructive: true,
      confirmText: 'Remove',
      onConfirm: () => {
        void removeProductApi(id)
          .then(() => setProducts((prev) => prev.filter((p) => p.id !== id)))
          .catch(() => dialog.alert('Error', 'Could not remove product. Try again.'));
      },
    });
  };

  const handleLaunch = async () => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const result = await submitForReview();

      if (result.submitted || result.autoApproved) {
        // Persist the new storeStatus so SecureStore stays accurate for offline fallback.
        const existing = await loadOnboardingMeta();
        void saveOnboardingMeta({
          ...existing,
          currentOnboardingStep: existing?.currentOnboardingStep ?? 7,
          isOnboardingComplete: false,
          storeStatus: result.autoApproved ? 'approved' : 'review',
        });
      }

      if (result.autoApproved) {
        router.replace('/(onboarding)/store-live');
      } else if (result.submitted) {
        router.replace('/(onboarding)/review-pending');
      } else {
        const needed = result.required - result.productsCount;
        setApiError(`Add ${needed} more product${needed === 1 ? '' : 's'} to launch your store.`);
      }
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View className="px-5">
        <OnboardingScreenHeader title="Add Your Products" onBack={handleBack} />
        <Text
          className="mb-2 text-right uppercase tracking-wider"
          style={{ fontSize: micro, color: colors.BODY_TEXT }}
        >
          STEP 5 OF 5
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ── */}
        <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          Add Your Products
        </Text>
        <Text className="mt-1" style={{ fontSize: body, color: colors.BODY_TEXT }}>
          Upload at least {MIN_PRODUCTS_REQUIRED} products to launch your jewelry storefront.
        </Text>

        {/* ── Why upload info card ── */}
        <View
          className="mt-4 rounded-xl border p-4"
          style={{ backgroundColor: colors.INFO_BG, borderColor: colors.INFO_BORDER }}
        >
          <View className="mb-3 flex-row items-center">
            <Ionicons name="information-circle" size={width * 0.055} color={colors.NAVY} />
            <Text className="ml-2 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
              Why upload products?
            </Text>
          </View>
          {PRODUCT_UPLOAD_BENEFITS.map((benefit) => (
            <View key={benefit} className="mb-2 flex-row items-start">
              <View
                className="mr-2 items-center justify-center rounded-full"
                style={{
                  width: width * 0.05,
                  height: width * 0.05,
                  backgroundColor: colors.SUCCESS,
                  marginTop: 2,
                }}
              >
                <Ionicons name="checkmark" size={width * 0.028} color={colors.WHITE} />
              </View>
              <Text className="flex-1" style={{ fontSize: label, color: colors.NAVY }}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Progress tracker ── */}
        <View
          className="mt-4 rounded-xl border p-4"
          style={{
            borderColor: canLaunch ? colors.SUCCESS : colors.BORDER,
            backgroundColor: colors.WHITE,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>
              <Text
                className="font-bold"
                style={{ fontSize: h2, color: canLaunch ? colors.SUCCESS : colors.NAVY }}
              >
                {addedCount}
              </Text>
              <Text style={{ fontSize: h2, color: colors.BODY_TEXT }}>
                {' '}
                / {MIN_PRODUCTS_REQUIRED}{' '}
              </Text>
              Products Added
            </Text>
            {canLaunch ? (
              <View
                className="flex-row items-center rounded-full px-2 py-1"
                style={{ backgroundColor: colors.SUCCESS }}
              >
                <Ionicons name="checkmark-circle" size={width * 0.04} color={colors.WHITE} />
                <Text
                  className="ml-1 font-semibold"
                  style={{ fontSize: micro, color: colors.WHITE }}
                >
                  Ready
                </Text>
              </View>
            ) : null}
          </View>
          <View
            className="mt-3 h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: colors.SURFACE_MUTED }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: canLaunch ? colors.SUCCESS : colors.NAVY,
              }}
            />
          </View>
          <Text className="mt-2" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            {progressHint}
          </Text>
        </View>

        {/* ── Product list ── */}
        {isLoadingProducts ? (
          <ActivityIndicator color={colors.NAVY} style={{ marginTop: 20 }} />
        ) : (
          <>
            {products.map((product) => (
              <View
                key={product.id}
                className="mt-3 flex-row rounded-xl border p-3"
                style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
              >
                {/* Thumbnail */}
                {product.imageUri ? (
                  <CachedImage
                    source={{ uri: product.imageUri }}
                    style={{ width: 76, height: 76, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="items-center justify-center rounded-xl"
                    style={{
                      width: 76,
                      height: 76,
                      backgroundColor: colors.SURFACE_MUTED,
                    }}
                  >
                    <Ionicons name="diamond-outline" size={width * 0.07} color={colors.BODY_TEXT} />
                  </View>
                )}

                {/* Info */}
                <View className="ml-3 flex-1">
                  <Text
                    className="font-bold"
                    style={{ fontSize: body, color: colors.NAVY }}
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  {product.category ? (
                    <View
                      className="mt-1 self-start rounded-full px-2 py-0.5"
                      style={{ backgroundColor: colors.INFO_BG }}
                    >
                      <Text style={{ fontSize: micro, color: colors.NAVY }}>
                        {formatCategoryName(product.category)}
                      </Text>
                    </View>
                  ) : null}
                  <Text
                    className="mt-1 font-semibold"
                    style={{ fontSize: body, color: colors.NAVY }}
                  >
                    {formatInr(product.price)}
                  </Text>
                </View>

                {/* Actions */}
                <View className="ml-2 items-center justify-center">
                  <Pressable
                    onPress={() => handleDeleteProduct(product.id, product.name)}
                    hitSlop={8}
                    accessibilityLabel={`Delete ${product.name}`}
                    className="items-center justify-center rounded-full"
                    style={{ width: 34, height: 34, backgroundColor: '#FEE2E2' }}
                  >
                    <Ionicons name="trash-outline" size={width * 0.042} color={colors.ERROR} />
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Add New Product button ── */}
        <Pressable
          onPress={handleAddProduct}
          className="mt-4 flex-row items-center justify-center rounded-xl border-2 py-4"
          style={{ borderColor: colors.NAVY, borderStyle: 'dashed' }}
        >
          <Ionicons name="add-circle-outline" size={width * 0.055} color={colors.NAVY} />
          <Text className="ml-2 font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
            Add New Product
          </Text>
        </Pressable>
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View
        className="border-t bg-white px-5 pt-3"
        style={{ borderColor: colors.BORDER, paddingBottom: insets.bottom + 12 }}
      >
        {apiError ? (
          <Text className="mb-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
            {apiError}
          </Text>
        ) : null}

        {!canLaunch ? (
          <View
            className="mb-2 flex-row items-center justify-center rounded-xl p-3"
            style={{ backgroundColor: colors.SURFACE_MUTED }}
          >
            <Ionicons name="lock-closed-outline" size={width * 0.04} color={colors.BODY_TEXT} />
            <Text className="ml-2" style={{ fontSize: label, color: colors.BODY_TEXT }}>
              Add {remaining} more product{remaining === 1 ? '' : 's'} to unlock Launch
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => void execute(handleLaunch)}
          disabled={!canLaunch || isSubmitting}
          className="flex-row items-center justify-center rounded-xl py-4"
          style={{
            backgroundColor: canLaunch ? colors.NAVY : colors.SURFACE_MUTED,
            minHeight: 52,
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={canLaunch ? colors.WHITE : colors.BODY_TEXT} />
          ) : (
            <>
              <Text style={{ fontSize: body, marginRight: 6 }}>{canLaunch ? '🚀' : '🔒'}</Text>
              <Text
                className="font-semibold"
                style={{ fontSize: button, color: canLaunch ? colors.WHITE : colors.BODY_TEXT }}
              >
                Launch My Store
              </Text>
            </>
          )}
        </Pressable>

        <Text className="mt-2 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          Your store will become live after product verification.
        </Text>
      </View>
    </View>
  );
}
