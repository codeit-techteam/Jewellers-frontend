import { DiamondIcon } from '@components/ui/DiamondIcon';
import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { colors } from '@constants/colors';
import { INVENTORY_DRAFTS_FILTER } from '@constants/inventory';
import { INVENTORY_SORT_OPTIONS } from '@constants/inventoryFilters';
import { useCategories } from '@hooks/useCategories';
import { formatCategoryName } from '@utils/categoryLabel';
import { inventoryQueryKeys } from '@lib/inventoryQueryKeys';
import { RETURN_TO_INVENTORY } from '@lib/navigateBack';
import { getProducts, removeProductApi } from '@services/inventoryService';
import { useInventoryStore } from '@store/useInventoryStore';
import type { InventoryProduct } from '@/types/inventory';
import { formatInr } from '@utils/formatCurrency';
import { matchesCategoryFilter } from '@utils/filterProductsByCategory';
import { applyInventoryListFilters } from '@utils/inventorySortFilter';
import { handleApiError } from '@utils/handleApiError';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { dialog } from '@utils/dialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ProductCard({
  product,
  width,
  body,
  label,
  micro,
  onPress,
  onRemove,
  onEdit,
}: {
  product: InventoryProduct;
  width: number;
  body: number;
  label: number;
  micro: number;
  onPress: () => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const makingLabel =
    product.makingChargesType === 'percentage'
      ? `${product.makingChargesValue}%`
      : formatInr(product.makingChargesValue);

  return (
    <View
      className="mb-3 rounded-xl border p-3"
      style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
    >
      <Pressable onPress={onPress}>
      <View className="flex-row">
        {product.imageUri ? (
          <Image
            source={{ uri: product.imageUri }}
            style={{ width: 80, height: 80, borderRadius: 8 }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="items-center justify-center rounded-lg"
            style={{ width: 80, height: 80, backgroundColor: colors.SURFACE_MUTED }}
          >
            <DiamondIcon size={width * 0.06} containerSize={56} containerColor={colors.SURFACE_MUTED} color={colors.BODY_TEXT} />
          </View>
        )}
        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between">
            <Text
              className="flex-1 font-bold"
              style={{ fontSize: body, color: colors.NAVY }}
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
              {formatInr(product.price)}
            </Text>
          </View>
          <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>SKU: {product.sku}</Text>
        </View>
      </View>

      <View
        className="mt-2 flex-row rounded-lg p-2"
        style={{ backgroundColor: colors.SURFACE_MUTED }}
      >
        {(
          [
            ['Views', product.analytics.views],
            ['Wishlist', product.analytics.wishlist],
            ['Inquiry', product.analytics.inquiry],
            ['WA Click', product.analytics.waClicks],
          ] as const
        ).map(([statLabel, value]) => (
          <View key={statLabel} className="flex-1 items-center">
            <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{statLabel}</Text>
            <Text className="font-bold" style={{ fontSize: label, color: colors.NAVY }}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-2 flex-row" style={{ gap: 8 }}>
        <View
          className="flex-1 flex-row items-center rounded-full px-3 py-1"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="scale-outline" size={14} color={colors.NAVY} />
          <Text className="ml-1" style={{ fontSize: micro, color: colors.NAVY }}>
            {product.weight}g
          </Text>
        </View>
        <View
          className="flex-1 flex-row items-center rounded-full px-3 py-1"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.NAVY} />
          <Text className="ml-1" style={{ fontSize: micro, color: colors.NAVY }} numberOfLines={1}>
            {product.purity}
          </Text>
        </View>
      </View>

      <Text className="mt-2" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
        Making Charges: {makingLabel}
      </Text>

      {/* Tags row */}
      {(product.gender || product.occasion || product.style) ? (
        <View className="mt-2 flex-row flex-wrap" style={{ gap: 6 }}>
          {[product.gender, product.occasion, product.style].filter(Boolean).map((tag) => (
            <View
              key={tag}
              className="rounded-full px-2 py-1"
              style={{ backgroundColor: colors.SURFACE_MUTED }}
            >
              <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Discount badge */}
      {product.discountPercent && product.discountPercent > 0 ? (
        <View
          className="mt-2 self-start rounded-full px-3 py-1"
          style={{ backgroundColor: colors.GOLD }}
        >
          <Text style={{ fontSize: micro, color: colors.WHITE, fontWeight: '600' }}>
            {product.discountPercent}% OFF Making Charges
          </Text>
        </View>
      ) : null}
      </Pressable>

      <View className="mt-3 flex-row items-center">
        <Pressable
          onPress={onRemove}
          className="flex-1 items-center justify-center rounded-lg py-2"
          style={{ backgroundColor: colors.NAVY }}
        >
          <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
            Remove
          </Text>
        </Pressable>
        <Pressable
          onPress={onEdit}
          className="ml-2 flex-1 items-center justify-center rounded-lg border py-2"
          style={{ borderColor: colors.NAVY }}
        >
          <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
            Edit
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const products = useInventoryStore((state) => state.products);
  const selectedCategory = useInventoryStore((state) => state.selectedCategory);
  const listPrefs = useInventoryStore((state) => state.listPrefs);
  const setCategory = useInventoryStore((state) => state.setCategory);
  const setListPrefs = useInventoryStore((state) => state.setListPrefs);
  const setProducts = useInventoryStore((state) => state.setProducts);
  const removeProduct = useInventoryStore((state) => state.removeProduct);

  const { data: categories = [] } = useCategories();
  const filterChips = useMemo(
    () => [
      { id: 'All', label: 'All' },
      ...categories.map((c) => ({ id: c.id, label: formatCategoryName(c.name) })),
    ],
    [categories],
  );

  const {
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: inventoryQueryKeys.all,
    queryFn: async () => {
      const data = await getProducts();
      setProducts(data);
      return data;
    },
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (selectedCategory === INVENTORY_DRAFTS_FILTER) {
      setCategory('All');
    }
  }, [selectedCategory, setCategory]);

  const filteredProducts = useMemo(
    () =>
      applyInventoryListFilters(
        products,
        {
          sortBy: listPrefs.sortBy,
          statusFilter: 'all',
          featuredOnly: false,
          recentlyAddedOnly: false,
          categoryId: selectedCategory,
          searchQuery,
        },
        matchesCategoryFilter,
      ),
    [products, listPrefs.sortBy, selectedCategory, searchQuery],
  );

  const activeSortLabel =
    INVENTORY_SORT_OPTIONS.find((o) => o.key === listPrefs.sortBy)?.label ?? 'Sort';

  const handleRemove = (product: InventoryProduct) => {
    void dialog.confirm(
      'Remove product',
      `Remove ${product.name || 'this product'}? This cannot be undone.`,
      {
        destructive: true,
        confirmText: 'Remove',
        onConfirm: async () => {
          try {
            await removeProductApi(product.id);
            removeProduct(product.id);
            void queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
          } catch (err) {
            void dialog.alert('Error', handleApiError(err));
            return;
          }
          void refetch();
        },
      },
    );
  };

  const listTitle = 'My Products';

  if (isPending && products.length === 0) {
    return <LoadingScreen message="Loading inventory…" />;
  }

  if (isError && products.length === 0) {
    return (
      <ErrorScreen message={handleApiError(error)} onRetry={() => void refetch()} />
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <View className="px-5">
        <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          Inventory
        </Text>
        <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>Manage your product catalogue</Text>

        <View
          className="mt-4 flex-row items-center rounded-xl border px-3"
          style={{ borderColor: colors.BORDER, backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="search-outline" size={20} color={colors.BODY_TEXT} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, SKU, or category"
            placeholderTextColor={colors.BODY_TEXT}
            className="ml-2 flex-1 py-3"
            style={{ fontSize: body, color: colors.NAVY }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.BODY_TEXT} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="mt-3 px-5">
        <Pressable
          onPress={() => setSortModalVisible(true)}
          className="flex-row items-center justify-center rounded-full border py-2.5"
          style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
        >
          <Ionicons name="swap-vertical-outline" size={16} color={colors.NAVY} />
          <Text className="ml-1 font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
            Sort: {activeSortLabel}
          </Text>
        </Pressable>
      </View>

      <View style={{ flexGrow: 0, marginTop: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            alignItems: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          {filterChips.map((chip) => {
            const isActive = chip.id === selectedCategory;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setCategory(chip.id)}
                style={{
                  backgroundColor: isActive ? colors.NAVY : colors.WHITE,
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.BORDER,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: label,
                    color: isActive ? colors.WHITE : colors.BODY_TEXT,
                    fontWeight: isActive ? '600' : '400',
                  }}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        className="px-5 pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isPending}
            onRefresh={() => void refetch()}
            tintColor={colors.NAVY}
          />
        }
      >
        <Text className="mb-3 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          {listTitle}
        </Text>

        {isPending && products.length > 0 ? (
          <View className="items-center py-4">
            <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>Refreshing…</Text>
          </View>
        ) : null}
        {filteredProducts.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="diamond-outline" size={48} color={colors.BODY_TEXT} />
            <Text className="mt-3 text-center" style={{ fontSize: body, color: colors.BODY_TEXT }}>
              {searchQuery.trim()
                ? 'No products match your search'
                : selectedCategory !== 'All'
                  ? 'No products in this category'
                  : 'No products yet — add your first piece'}
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/inventory/add',
                  params: { returnTo: RETURN_TO_INVENTORY },
                })
              }
              className="mt-4 rounded-full px-4 py-2"
              style={{ backgroundColor: colors.NAVY }}
            >
              <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
                Add Product
              </Text>
            </Pressable>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              width={width}
              body={body}
              label={label}
              micro={micro}
              onPress={() =>
                router.push({
                  pathname: '/(app)/product-detail',
                  params: { productId: product.id, returnTo: RETURN_TO_INVENTORY },
                })
              }
              onRemove={() => handleRemove(product)}
              onEdit={() =>
                router.push({
                  pathname: '/(app)/inventory/edit',
                  params: { productId: product.id, returnTo: RETURN_TO_INVENTORY },
                })
              }
            />
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(app)/inventory/add',
            params: { returnTo: RETURN_TO_INVENTORY },
          })
        }
        className="absolute items-center justify-center rounded-full"
        style={{
          width: 56,
          height: 56,
          backgroundColor: colors.NAVY,
          right: 20,
          bottom: insets.bottom + 76,
        }}
      >
        <Ionicons name="add" size={28} color={colors.WHITE} />
      </Pressable>

      <Modal visible={sortModalVisible} transparent animationType="fade" onRequestClose={() => setSortModalVisible(false)}>
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: colors.OVERLAY_DARK }}
          onPress={() => setSortModalVisible(false)}
        >
          <Pressable className="rounded-t-2xl bg-white px-5 pb-8 pt-4" onPress={(e) => e.stopPropagation()}>
            <Text className="mb-3 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
              Sort By
            </Text>
            {INVENTORY_SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => {
                  setListPrefs({ sortBy: option.key });
                  setSortModalVisible(false);
                }}
                className="flex-row items-center justify-between border-b py-3"
                style={{ borderColor: colors.BORDER }}
              >
                <Text style={{ fontSize: body, color: colors.NAVY }}>{option.label}</Text>
                {listPrefs.sortBy === option.key ? (
                  <Ionicons name="checkmark" size={20} color={colors.GOLD} />
                ) : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
