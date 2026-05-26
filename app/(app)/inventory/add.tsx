import { InventoryProductForm } from '@components/inventory/InventoryProductForm';
import type { InventoryFormSubmitMode } from '@components/inventory/InventoryProductForm';
import { colors } from '@constants/colors';
import { inventoryQueryKeys } from '@lib/inventoryQueryKeys';
import {
  addProduct as addProductApi,
  getProduct,
  saveDraftProduct,
  updateProductApi,
} from '@services/inventoryService';
import { useInventoryStore } from '@store/useInventoryStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddProductForm, InventoryProduct } from '@/types/inventory';
import { calculateProductPrice } from '@utils/calculateProductPrice';
import { handleApiError } from '@utils/handleApiError';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { dialog } from '@utils/dialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function toAddProductForm(product: InventoryProduct): AddProductForm {
  return {
    name: product.name,
    categoryId: product.categoryId,
    weight: product.weight,
    purity: product.purity,
    makingChargesType: product.makingChargesType,
    makingChargesValue: product.makingChargesValue,
    imageUri: product.imageUri,
    imageUris: product.imageUris,
    additionalDetails: product.additionalDetails,
    description: product.description,
    gender: product.gender,
    occasion: product.occasion,
    style: product.style,
    availableSizes: product.availableSizes,
    availableMetals: product.availableMetals,
    discountPercent: product.discountPercent,
    priceBreakup: product.priceBreakup,
    specifications: product.specifications,
    collectionName: product.collectionName,
    videoUri: product.videoUri,
    videoUrl: product.videoUrl,
  };
}

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const h2 = width * 0.048;
  const { productId, returnTo } = useLocalSearchParams<{
    productId?: string;
    returnTo?: string;
  }>();

  const queryClient = useQueryClient();
  const products = useInventoryStore((state) => state.products);
  const addProduct = useInventoryStore((state) => state.addProduct);
  const updateProduct = useInventoryStore((state) => state.updateProduct);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cachedDraft = useMemo(
    () => (productId ? products.find((item) => item.id === productId) : undefined),
    [productId, products],
  );

  const { data: fetchedDraft } = useQuery({
    queryKey: inventoryQueryKeys.detail(productId ?? ''),
    queryFn: () => getProduct(productId!),
    enabled: Boolean(productId && !cachedDraft),
  });

  const draftProduct = cachedDraft ?? fetchedDraft;
  const isCompleteDraftMode = Boolean(draftProduct?.isDraft && productId);

  if (productId && !draftProduct) {
    return <LoadingScreen message="Loading draft…" />;
  }

  const handleSubmit = async (product: InventoryProduct, mode: InventoryFormSubmitMode) => {
    setIsSubmitting(true);
    try {
      const price = calculateProductPrice(
        product.weight,
        product.makingChargesType,
        product.makingChargesValue,
      );
      const formData = toAddProductForm(product);

      if (isCompleteDraftMode && productId) {
        // Updating an existing draft product — use PUT, not POST
        const isDraft = mode === 'draft';
        const saved = await updateProductApi(productId, { ...product, price, isDraft });
        updateProduct(productId, saved);
        void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
        navigateBack(router, returnTo);
        return;
      }

      if (mode === 'draft') {
        const saved = await saveDraftProduct(formData);
        addProduct(saved);
      } else {
        const saved = await addProductApi(formData);
        addProduct(saved);
      }
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
      navigateBack(router, returnTo);
    } catch (err) {
      void dialog.alert('Error', handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="mb-2 flex-row items-center px-5">
        <Pressable
          onPress={() => navigateBack(router, returnTo)}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          {isCompleteDraftMode ? 'Complete Product' : 'Add New Product'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <InventoryProductForm
          mode="add"
          initialProduct={isCompleteDraftMode ? draftProduct : undefined}
          isSubmitting={isSubmitting}
          onSubmit={(p, m) => void handleSubmit(p, m)}
        />
      </View>
    </View>
  );
}
