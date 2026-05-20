import { InventoryProductForm } from '@components/inventory/InventoryProductForm';
import type { InventoryFormSubmitMode } from '@components/inventory/InventoryProductForm';
import { colors } from '@constants/colors';
import { addProduct as addProductApi, saveDraftProduct } from '@services/inventoryService';
import { useInventoryStore } from '@store/useInventoryStore';
import type { AddProductForm, InventoryProduct } from '@/types/inventory';
import { calculateProductPrice } from '@utils/calculateProductPrice';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function toAddProductForm(product: InventoryProduct): AddProductForm {
  return {
    name: product.name,
    category: product.category,
    weight: product.weight,
    purity: product.purity,
    makingChargesType: product.makingChargesType,
    makingChargesValue: product.makingChargesValue,
    imageUri: product.imageUri,
    imageUris: product.imageUris,
    additionalDetails: product.additionalDetails,
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

  const products = useInventoryStore((state) => state.products);
  const addProduct = useInventoryStore((state) => state.addProduct);
  const updateProduct = useInventoryStore((state) => state.updateProduct);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const draftProduct = useMemo(
    () => (productId ? products.find((item) => item.id === productId) : undefined),
    [productId, products],
  );

  const isCompleteDraftMode = Boolean(draftProduct?.isDraft && productId);

  const handleSubmit = async (product: InventoryProduct, mode: InventoryFormSubmitMode) => {
    setIsSubmitting(true);
    try {
      const formData = toAddProductForm(product);

      if (isCompleteDraftMode && productId) {
        if (mode === 'draft') {
          await saveDraftProduct(formData);
          updateProduct(productId, { ...product, isDraft: true, price: 0 });
        } else {
          const price = calculateProductPrice(
            product.weight,
            product.makingChargesType,
            product.makingChargesValue,
          );
          await addProductApi(formData);
          updateProduct(productId, { ...product, price, isDraft: false });
        }
        navigateBack(router, returnTo);
        return;
      }

      if (mode === 'draft') {
        const saved = await saveDraftProduct(formData);
        addProduct({ ...saved, ...product, isDraft: true, price: 0 });
      } else {
        const price = calculateProductPrice(
          product.weight,
          product.makingChargesType,
          product.makingChargesValue,
        );
        const saved = await addProductApi(formData);
        addProduct({ ...saved, ...product, price, isDraft: false });
      }
      navigateBack(router, returnTo);
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
      <InventoryProductForm
        mode="add"
        initialProduct={isCompleteDraftMode ? draftProduct : undefined}
        isSubmitting={isSubmitting}
        onSubmit={(p, m) => void handleSubmit(p, m)}
      />
    </View>
  );
}
