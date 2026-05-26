import { InventoryProductForm } from '@components/inventory/InventoryProductForm';
import type { InventoryFormSubmitMode } from '@components/inventory/InventoryProductForm';
import { colors } from '@constants/colors';
import { saveDraftProduct } from '@services/inventoryService';
import type { AddProductForm, InventoryProduct } from '@/types/inventory';
import { handleApiError } from '@utils/handleApiError';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

/**
 * Onboarding-specific add product screen.
 * Lives inside (onboarding) group so it is never blocked by the
 * useRequireOnboardingComplete guard that protects the (app) group.
 *
 * Products are ALWAYS saved as drafts (isDraft: true / status: 'draft').
 * They become active automatically when the admin approves the boutique.
 */
export default function OnboardingAddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const h2 = width * 0.048;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/step5-products');
    }
  };

  const handleSubmit = async (product: InventoryProduct, _mode: InventoryFormSubmitMode) => {
    setIsSubmitting(true);
    try {
      const formData = toAddProductForm(product);
      // Always save as draft during onboarding — activated on boutique approval
      await saveDraftProduct(formData);
      goBack();
    } catch (err) {
      void dialog.alert('Error', handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="mb-2 flex-row items-center px-5">
        <Pressable
          onPress={goBack}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          Add New Product
        </Text>
      </View>

      {/* Info banner */}
      <View
        className="mx-5 mb-2 flex-row items-center rounded-xl px-3 py-2"
        style={{ backgroundColor: colors.INFO_BG }}
      >
        <Ionicons name="time-outline" size={width * 0.042} color={colors.NAVY} />
        <Text className="ml-2 flex-1" style={{ fontSize: width * 0.031, color: colors.NAVY }}>
          Products will be visible to customers after your store is approved.
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <InventoryProductForm
          mode="add"
          isSubmitting={isSubmitting}
          onSubmit={(p, m) => void handleSubmit(p, m)}
        />
      </View>
    </View>
  );
}
