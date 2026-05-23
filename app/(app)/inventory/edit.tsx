import { InventoryProductForm } from '@components/inventory/InventoryProductForm';
import type { InventoryFormSubmitMode } from '@components/inventory/InventoryProductForm';
import { colors } from '@constants/colors';
import { inventoryQueryKeys } from '@lib/inventoryQueryKeys';
import { getProduct, removeProductApi, updateProductApi } from '@services/inventoryService';
import { useInventoryStore } from '@store/useInventoryStore';
import { useQueryClient } from '@tanstack/react-query';
import type { InventoryProduct } from '@/types/inventory';
import { calculateProductPrice } from '@utils/calculateProductPrice';
import { handleApiError } from '@utils/handleApiError';
import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { dialog } from '@utils/dialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const h2 = width * 0.048;
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const queryClient = useQueryClient();
  const products = useInventoryStore((state) => state.products);
  const updateProduct = useInventoryStore((state) => state.updateProduct);
  const removeProduct = useInventoryStore((state) => state.removeProduct);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState<InventoryProduct | undefined>(
    products.find((item) => item.id === productId),
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProduct = async () => {
    if (!productId) return;
    setLoadError(null);
    try {
      const fetched = await getProduct(productId);
      setProduct(fetched);
      updateProduct(productId, fetched);
    } catch (err) {
      setLoadError(handleApiError(err));
    }
  };

  useEffect(() => {
    if (!productId) {
      router.back();
      return;
    }
    void loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (!productId) {
    return null;
  }

  if (loadError && !product) {
    return <ErrorScreen message={loadError} onRetry={() => void loadProduct()} />;
  }

  if (!product) {
    return <LoadingScreen message="Loading product…" />;
  }

  const handleSubmit = async (updated: InventoryProduct, mode: InventoryFormSubmitMode) => {
    if (mode === 'delete') {
      return;
    }
    setIsSubmitting(true);
    try {
      const price =
        updated.weight > 0
          ? calculateProductPrice(
              updated.weight,
              updated.makingChargesType,
              updated.makingChargesValue,
            )
          : product.price;
      const saved = await updateProductApi(product.id, { ...updated, price, isDraft: false });
      updateProduct(product.id, saved);
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
      router.back();
    } catch (err) {
      void dialog.alert('Error', handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    void dialog.confirm('Delete product', `Delete ${product.name}? This cannot be undone.`, {
      destructive: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await removeProductApi(product.id);
          removeProduct(product.id);
          void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
          router.back();
        } catch (err) {
          void dialog.alert('Error', handleApiError(err));
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="mb-2 flex-row items-center px-5">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          Edit Product
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <InventoryProductForm
          mode="edit"
          initialProduct={product}
          isSubmitting={isSubmitting}
          onSubmit={(p, m) => void handleSubmit(p, m)}
          onDelete={handleDelete}
        />
      </View>
    </View>
  );
}
