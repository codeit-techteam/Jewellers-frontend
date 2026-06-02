import { StorefrontProductCard } from '@components/storefront/StorefrontProductCard';
import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { colors } from '@constants/colors';
import { inventoryQueryKeys } from '@lib/inventoryQueryKeys';
import { getProducts } from '@services/inventoryService';
import { useInventoryStore } from '@store/useInventoryStore';
import {
  buildStorefrontInventoryProducts,
  type StorefrontDisplayProduct,
} from '@utils/buildStorefrontInventoryProducts';
import { handleApiError } from '@utils/handleApiError';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { usePullToRefresh } from '@hooks/usePullToRefresh';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function isTrackableProductId(id: string): boolean {
  return !id.startsWith('mock-');
}

export default function AllProductsScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h2 = width * 0.048;
  const label = width * 0.032;
  const productNameSize = width * 0.036;

  const setProducts = useInventoryStore((state) => state.setProducts);
  const incrementView = useInventoryStore((state) => state.incrementView);

  const productsQuery = useQuery({
    queryKey: inventoryQueryKeys.all,
    queryFn: async () => {
      const data = await getProducts({ status: 'active', is_draft: false });
      setProducts(data);
      return data;
    },
  });

  const { isRefreshing: isAllProductsRefreshing, onRefresh: onAllProductsRefresh } =
    usePullToRefresh([productsQuery]);

  const displayProducts = useMemo(
    () => buildStorefrontInventoryProducts(productsQuery.data ?? []),
    [productsQuery.data],
  );

  const handleViewDetails = useCallback(
    (product: StorefrontDisplayProduct) => {
      if (!isTrackableProductId(product.id)) {
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

  if (productsQuery.isPending && !productsQuery.data) {
    return <LoadingScreen message="Loading products…" />;
  }

  if (productsQuery.isError && !productsQuery.data) {
    return (
      <ErrorScreen
        message={handleApiError(productsQuery.error)}
        onRetry={() => void productsQuery.refetch()}
      />
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={isAllProductsRefreshing}
            onRefresh={onAllProductsRefresh}
            tintColor={colors.NAVY}
          />
        }
      >
        {displayProducts.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="diamond-outline" size={48} color={colors.BODY_TEXT} />
            <Text className="mt-3" style={{ fontSize: label, color: colors.BODY_TEXT }}>
              No active products yet
            </Text>
          </View>
        ) : (
          displayProducts.map((product) => (
            <StorefrontProductCard
              key={product.id}
              product={product}
              productNameSize={productNameSize}
              onViewDetails={() => handleViewDetails(product)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
