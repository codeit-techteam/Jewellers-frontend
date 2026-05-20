import { StorefrontProductCard } from '@components/storefront/StorefrontProductCard';
import { colors } from '@constants/colors';
import { useInventoryStore } from '@store/useInventoryStore';
import {
  buildStorefrontInventoryProducts,
  type StorefrontDisplayProduct,
} from '@utils/buildStorefrontInventoryProducts';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function isTrackableInventoryId(id: string): boolean {
  return id.startsWith('inv-') || id.startsWith('draft-');
}

export default function AllProductsScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h2 = width * 0.048;
  const label = width * 0.032;
  const productNameSize = width * 0.036;

  const inventoryProducts = useInventoryStore((state) => state.products);
  const incrementView = useInventoryStore((state) => state.incrementView);

  const displayProducts = useMemo(
    () => buildStorefrontInventoryProducts(inventoryProducts),
    [inventoryProducts],
  );

  const handleViewDetails = useCallback(
    (product: StorefrontDisplayProduct) => {
      if (!isTrackableInventoryId(product.id)) {
        Alert.alert('Preview product', 'Add this product to your inventory to view full details.');
        return;
      }
      incrementView(product.id);
      router.push({
        pathname: '/(app)/product-detail',
        params: {
          productId: product.id,
          ...(returnTo ? { returnTo } : {}),
        },
      });
    },
    [incrementView, returnTo, router],
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
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          All Products
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap justify-between">
          {displayProducts.map((product) => (
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
      </ScrollView>
    </View>
  );
}
