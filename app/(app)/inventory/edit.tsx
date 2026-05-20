import { InventoryProductForm } from '@components/inventory/InventoryProductForm';
import type { InventoryFormSubmitMode } from '@components/inventory/InventoryProductForm';
import { colors } from '@constants/colors';
import { removeProductApi, updateProductApi } from '@services/inventoryService';
import { useInventoryStore } from '@store/useInventoryStore';
import type { InventoryProduct } from '@/types/inventory';
import { calculateProductPrice } from '@utils/calculateProductPrice';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const h2 = width * 0.048;
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const products = useInventoryStore((state) => state.products);
  const updateProduct = useInventoryStore((state) => state.updateProduct);
  const removeProduct = useInventoryStore((state) => state.removeProduct);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const product = products.find((item) => item.id === productId);

  useEffect(() => {
    if (!productId || !product) {
      router.back();
    }
  }, [product, productId, router]);

  if (!productId || !product) {
    return null;
  }

  const handleSubmit = async (updated: InventoryProduct, mode: InventoryFormSubmitMode) => {
    if (mode === 'delete') {
      return;
    }
    setIsSubmitting(true);
    try {
      const price = calculateProductPrice(
        updated.weight,
        updated.makingChargesType,
        updated.makingChargesValue,
      );
      await updateProductApi(product.id, { ...updated, price });
      updateProduct(product.id, { ...updated, price, isDraft: false });
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete product', `Delete ${product.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsSubmitting(true);
            try {
              await removeProductApi(product.id);
              removeProduct(product.id);
              router.back();
            } finally {
              setIsSubmitting(false);
            }
          })();
        },
      },
    ]);
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
      <InventoryProductForm
        mode="edit"
        initialProduct={product}
        isSubmitting={isSubmitting}
        onSubmit={(p, m) => void handleSubmit(p, m)}
        onDelete={handleDelete}
      />
    </View>
  );
}
