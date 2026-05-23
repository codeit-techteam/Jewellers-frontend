import { OnboardingScreenHeader } from '@components/onboarding/OnboardingScreenHeader';
import { pickImageFromLibrary } from '@components/ui/DocumentUploader';
import { colors } from '@constants/colors';
import {
  MIN_PRODUCTS_REQUIRED,
  PRODUCT_UPLOAD_BENEFITS,
} from '@constants/products';
import { useFontScale } from '@hooks/useFontScale';
import { handleApiError } from '@utils/handleApiError';
import { submitForReview } from '@services/onboardingService';
import { getProducts, removeProductApi, saveSimpleProduct } from '@services/inventoryService';
import { useOnboardingStore } from '@store/useOnboardingStore';
import type { InventoryProduct } from '@/types/inventory';
import { useCategories } from '@hooks/useCategories';
import { formatCategoryName } from '@utils/categoryLabel';
import { formatInr } from '@utils/formatCurrency';
import { dialog } from '@utils/dialog';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').min(3, 'Minimum 3 characters'),
  categoryId: z.string().uuid('Select a category'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((value) => {
      const parsed = Number(value.replace(/,/g, ''));
      return !Number.isNaN(parsed) && parsed > 0;
    }, 'Enter a valid positive price'),
});

type ProductFormValues = {
  name: string;
  categoryId: string;
  price: string;
};

const defaultFormValues: ProductFormValues = {
  name: '',
  categoryId: '',
  price: '',
};

export default function Step5ProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, h1, h2, body, label, micro, button } = useFontScale();
  const scrollRef = useRef<ScrollView>(null);

  const setStoreStatus = useOnboardingStore((state) => state.setStoreStatus);
  const setOnboardingStep = useOnboardingStore((state) => state.setOnboardingStep);
  const isSubmitting = useOnboardingStore((state) => state.isSubmitting);
  const setIsSubmitting = useOnboardingStore((state) => state.setIsSubmitting);

  const [apiProducts, setApiProducts] = useState<InventoryProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();

  // Load persisted products from the server on mount so progress survives restarts.
  useEffect(() => {
    const fetchApiProducts = async () => {
      try {
        const fetched = await getProducts({ status: 'active', is_draft: false });
        setApiProducts(fetched);
      } catch {
        // Network failure — fall back to showing only local products
      } finally {
        setIsLoadingProducts(false);
      }
    };
    void fetchApiProducts();
  }, []);

  // Only count DB-persisted products (local-only products are no longer used).
  const addedCount = apiProducts.length;
  const remaining = Math.max(0, MIN_PRODUCTS_REQUIRED - addedCount);
  const progressPercent = Math.min(100, (addedCount / MIN_PRODUCTS_REQUIRED) * 100);
  const canContinue = addedCount >= MIN_PRODUCTS_REQUIRED;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const selectedCategoryId = watch('categoryId');
  const selectedCategoryLabel =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? '';

  const resetForm = useCallback(() => {
    reset(defaultFormValues);
    setImageUri(null);
    setImageFileName(null);
    setImageError(null);
  }, [reset]);

  const handlePickImage = async () => {
    const picked = await pickImageFromLibrary();
    if (picked?.fileUri) {
      setImageUri(picked.fileUri);
      setImageFileName(picked.fileName ?? null);
      setImageError(null);
    }
  };

  const handleRemoveProduct = (id: string, name: string) => {
    void dialog.confirm(`Remove "${name}"?`, 'This product will be deleted from your list.', {
      destructive: true,
      confirmText: 'Remove',
      onConfirm: () => {
        void removeProductApi(id)
          .then(() => setApiProducts((prev) => prev.filter((p) => p.id !== id)))
          .catch(() => dialog.alert('Error', 'Could not remove product. Try again.'));
      },
    });
  };

  const onAddProduct = async (values: ProductFormValues) => {
    if (!imageUri) {
      setImageError('Product image is required');
      return;
    }

    setIsSavingProduct(true);
    try {
      const saved = await saveSimpleProduct({
        name: values.name.trim(),
        categoryId: values.categoryId,
        price: Number(values.price.replace(/,/g, '')),
        imageUri,
        imageFileName: imageFileName ?? undefined,
      });
      setApiProducts((prev) => [...prev, saved]);
      resetForm();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      void dialog.alert('Could not save product', handleApiError(error));
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleContinue = async () => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const result = await submitForReview();
      if (result.autoApproved) {
        router.replace('/(onboarding)/store-live');
      } else if (result.submitted) {
        router.replace('/(onboarding)/review-pending');
      } else {
        const needed = result.required - result.productsCount;
        setApiError(
          `Add ${needed} more product${needed === 1 ? '' : 's'} to launch your store.`,
        );
      }
    } catch (error) {
      setApiError(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressHint =
    addedCount >= MIN_PRODUCTS_REQUIRED
      ? 'Minimum reached! Add more to strengthen your store.'
      : `Add ${remaining} more product${remaining === 1 ? '' : 's'} to continue`;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="px-5">
        <OnboardingScreenHeader title="Add Your Products" onBack={() => router.back()} />
        <Text
          className="mb-2 text-right uppercase tracking-wider"
          style={{ fontSize: micro, color: colors.BODY_TEXT }}
        >
          STEP 5 OF 5
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          Add Your Products
        </Text>
        <Text className="mt-2" style={{ fontSize: body, color: colors.BODY_TEXT }}>
          Upload at least {MIN_PRODUCTS_REQUIRED} products to launch your jewelry storefront.
        </Text>

        <View
          className="mt-5 rounded-xl border p-4"
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

        <View
          className="mt-5 rounded-xl border p-4"
          style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
        >
          <Text style={{ fontSize: body, color: colors.BODY_TEXT }}>
            <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
              {addedCount}
            </Text>
            <Text style={{ fontSize: h2, color: colors.BODY_TEXT }}> / {MIN_PRODUCTS_REQUIRED} </Text>
            Products Added
          </Text>
          <View
            className="mt-3 h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: colors.SURFACE_MUTED }}
          >
            <View
              className="h-full rounded-full"
              style={{ width: `${progressPercent}%`, backgroundColor: colors.NAVY }}
            />
          </View>
          <Text className="mt-2" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            {progressHint}
          </Text>
        </View>

        {isLoadingProducts ? (
          <ActivityIndicator color={colors.NAVY} style={{ marginTop: 16 }} />
        ) : null}

        {apiProducts.map((product) => (
          <View
            key={product.id}
            className="mt-3 flex-row rounded-xl border p-3"
            style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
          >
            <Image
              source={{ uri: product.imageUri }}
              style={{ width: 80, height: 80, borderRadius: 8 }}
              resizeMode="cover"
            />
            <View className="ml-3 flex-1 justify-between">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                    {product.name}
                  </Text>
                  <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
                    {formatCategoryName(product.category)}
                  </Text>
                  <Text className="mt-1 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
                    {formatInr(product.price)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleRemoveProduct(product.id, product.name)}
                  hitSlop={8}
                  accessibilityLabel={`Remove ${product.name}`}
                >
                  <Ionicons name="trash-outline" size={width * 0.05} color={colors.ERROR} />
                </Pressable>
              </View>
              <View className="flex-row justify-end">
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: colors.NAVY }}
                >
                  <Text
                    className="font-semibold uppercase"
                    style={{ fontSize: micro, color: colors.WHITE }}
                  >
                    {formatCategoryName(product.category)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View
          className="mt-5 flex-row rounded-xl border border-dashed p-3"
          style={{ borderColor: colors.UPLOAD_BORDER_DASHED }}
        >
          <Pressable
            onPress={() => void handlePickImage()}
            className="items-center justify-center rounded-lg border border-dashed"
            style={{
              width: 80,
              height: 80,
              borderColor: colors.BORDER,
              backgroundColor: colors.UPLOAD_BG,
            }}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 80, height: 80, borderRadius: 8 }}
                resizeMode="cover"
              />
            ) : (
              <>
                <Ionicons name="diamond-outline" size={width * 0.06} color={colors.BODY_TEXT} />
                <Text
                  className="mt-1 text-center"
                  style={{ fontSize: micro, color: colors.BODY_TEXT }}
                >
                  Upload Image
                </Text>
              </>
            )}
          </Pressable>

          <View className="ml-3 flex-1">
            <Text className="mb-1 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
              Product Name
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Gold Bangles"
                  placeholderTextColor={colors.BODY_TEXT}
                  className="mb-2 rounded-lg border px-3 py-2"
                  style={{
                    borderColor: errors.name ? colors.ERROR : colors.BORDER,
                    fontSize: body,
                    color: colors.NAVY,
                  }}
                />
              )}
            />
            {errors.name ? (
              <Text style={{ fontSize: micro, color: colors.ERROR }}>{errors.name.message}</Text>
            ) : null}

            <View className="mt-2 flex-row" style={{ gap: width * 0.03 }}>
              <View className="flex-1">
                <Text className="mb-1 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
                  Category
                </Text>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field: { onChange, value } }) => (
                    <>
                      <Pressable
                        onPress={() => {
                          if (!isLoadingCategories && categories.length > 0) {
                            setCategoryModalVisible(true);
                          }
                        }}
                        className="flex-row items-center justify-between rounded-lg border px-3 py-2"
                        style={{ borderColor: errors.categoryId ? colors.ERROR : colors.BORDER }}
                      >
                        <Text
                          style={{
                            fontSize: body,
                            color: value ? colors.NAVY : colors.BODY_TEXT,
                          }}
                        >
                          {isLoadingCategories
                            ? 'Loading…'
                            : selectedCategoryLabel
                              ? formatCategoryName(selectedCategoryLabel)
                              : 'Select'}
                        </Text>
                        <Ionicons name="chevron-down" size={width * 0.04} color={colors.BODY_TEXT} />
                      </Pressable>
                      <Modal
                        visible={categoryModalVisible}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setCategoryModalVisible(false)}
                      >
                        <Pressable
                          className="flex-1 justify-end"
                          style={{ backgroundColor: colors.OVERLAY_DARK }}
                          onPress={() => setCategoryModalVisible(false)}
                        >
                          <View
                            className="rounded-t-2xl bg-white px-4 pb-8 pt-4"
                            style={{ paddingBottom: insets.bottom + 16 }}
                          >
                            <Text
                              className="mb-3 font-semibold"
                              style={{ fontSize: body, color: colors.NAVY }}
                            >
                              Select category
                            </Text>
                            {categories.map((category) => {
                              const isSelected = category.id === selectedCategoryId;
                              return (
                                <Pressable
                                  key={category.id}
                                  onPress={() => {
                                    onChange(category.id);
                                    setCategoryModalVisible(false);
                                  }}
                                  className="rounded-lg px-3 py-3"
                                  style={{
                                    backgroundColor: isSelected ? colors.INFO_BG : undefined,
                                  }}
                                >
                                  <Text style={{ fontSize: body, color: colors.NAVY }}>
                                    {formatCategoryName(category.name)}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </Pressable>
                      </Modal>
                    </>
                  )}
                />
              </View>

              <View className="flex-1">
                <Text className="mb-1 font-medium" style={{ fontSize: label, color: colors.NAVY }}>
                  Price
                </Text>
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      className="flex-row items-center rounded-lg border px-3"
                      style={{ borderColor: errors.price ? colors.ERROR : colors.BORDER }}
                    >
                      <Text style={{ fontSize: body, color: colors.NAVY }}>₹</Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={colors.BODY_TEXT}
                        className="flex-1 py-2"
                        style={{ fontSize: body, color: colors.NAVY, marginLeft: 4 }}
                      />
                    </View>
                  )}
                />
                {errors.price ? (
                  <Text style={{ fontSize: micro, color: colors.ERROR }}>
                    {errors.price.message}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {imageError ? (
          <Text className="mt-1" style={{ fontSize: micro, color: colors.ERROR }}>
            {imageError}
          </Text>
        ) : null}

        <Pressable
          onPress={() => { void handleSubmit(onAddProduct)(); }}
          disabled={isSavingProduct || isSubmitting}
          className="mt-4 items-center justify-center rounded-xl border py-3"
          style={{ borderColor: colors.NAVY, minHeight: 48, opacity: isSavingProduct ? 0.7 : 1 }}
        >
          {isSavingProduct ? (
            <ActivityIndicator color={colors.NAVY} />
          ) : (
            <Text className="font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
              + Add Another Product
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <View
        className="border-t bg-white px-5 pt-3"
        style={{ borderColor: colors.BORDER, paddingBottom: insets.bottom + 8 }}
      >
        {apiError ? (
          <Text className="mb-2 text-center" style={{ fontSize: label, color: colors.ERROR }}>
            {apiError}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void handleContinue()}
          disabled={isSubmitting || isSavingProduct}
          className="flex-row items-center justify-center rounded-xl py-3"
          style={{
            backgroundColor: colors.NAVY,
            minHeight: 52,
            opacity: isSubmitting || isSavingProduct ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.WHITE} />
          ) : (
            <>
              <Text style={{ fontSize: body, marginRight: 4 }}>🚀</Text>
              <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
                Continue to Launch
              </Text>
            </>
          )}
        </Pressable>

        <Text className="mt-3 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          Your store will become live after product verification.
        </Text>
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}
