import { DiamondIcon } from '@components/ui/DiamondIcon';
import { colors } from '@constants/colors';
import { INVENTORY_DRAFTS_FILTER, INVENTORY_FILTER_CATEGORIES } from '@constants/inventory';
import { useInventoryStore } from '@store/useInventoryStore';
import type { InventoryProduct } from '@/types/inventory';
import { formatInr } from '@utils/formatCurrency';
import { matchesCategoryFilter } from '@utils/filterProductsByCategory';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTER_CATEGORIES = [...INVENTORY_FILTER_CATEGORIES, INVENTORY_DRAFTS_FILTER];

function displayOrDash(value: string | number | undefined): string {
  if (value === undefined || value === null) {
    return '—';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return '—';
  }
  if (typeof value === 'number' && value === 0) {
    return '—';
  }
  return String(value);
}

function DraftCard({
  product,
  width,
  body,
  label,
  onComplete,
  onDelete,
}: {
  product: InventoryProduct;
  width: number;
  body: number;
  label: number;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const priceLabel =
    product.price > 0 ? formatInr(product.price) : displayOrDash(product.price || undefined);

  return (
    <View
      className="mb-3 rounded-xl border p-3"
      style={{
        borderColor: colors.BORDER,
        backgroundColor: colors.WHITE,
        borderLeftWidth: 4,
        borderLeftColor: colors.GOLD,
      }}
    >
      <View className="absolute right-3 top-3 rounded-full px-2 py-0.5" style={{ backgroundColor: colors.TIP_BG }}>
        <Text className="font-bold" style={{ fontSize: width * 0.024, color: colors.GOLD }}>
          DRAFT
        </Text>
      </View>

      <View className="flex-row pr-16">
        {product.imageUri ? (
          <Image
            source={{ uri: product.imageUri }}
            style={{ width: 64, height: 64, borderRadius: 8 }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="items-center justify-center rounded-lg"
            style={{ width: 64, height: 64, backgroundColor: colors.SURFACE_MUTED }}
          >
            <DiamondIcon size={width * 0.05} containerSize={40} containerColor={colors.SURFACE_MUTED} color={colors.BODY_TEXT} />
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }} numberOfLines={1}>
            {displayOrDash(product.name)}
          </Text>
          <Text style={{ fontSize: width * 0.028, color: colors.BODY_TEXT }}>
            {displayOrDash(product.category)}
          </Text>
          <Text className="mt-1 font-bold" style={{ fontSize: body, color: colors.NAVY }}>
            {priceLabel}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center">
        <Pressable
          onPress={onComplete}
          className="flex-1 items-center justify-center rounded-lg py-2"
          style={{ backgroundColor: colors.NAVY }}
        >
          <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
            Complete
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          className="ml-2 flex-1 items-center justify-center rounded-lg border py-2"
          style={{ borderColor: colors.ERROR }}
        >
          <Text className="font-semibold" style={{ fontSize: label, color: colors.ERROR }}>
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProductCard({
  product,
  width,
  body,
  label,
  micro,
  onRemove,
  onEdit,
}: {
  product: InventoryProduct;
  width: number;
  body: number;
  label: number;
  micro: number;
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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  const products = useInventoryStore((state) => state.products);
  const selectedCategory = useInventoryStore((state) => state.selectedCategory);
  const setCategory = useInventoryStore((state) => state.setCategory);
  const removeProduct = useInventoryStore((state) => state.removeProduct);

  const draftProducts = useMemo(() => products.filter((product) => product.isDraft), [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === INVENTORY_DRAFTS_FILTER) {
      return draftProducts;
    }
    return products.filter(
      (product) => !product.isDraft && matchesCategoryFilter(product, selectedCategory),
    );
  }, [products, selectedCategory, draftProducts]);

  const showDraftsSection =
    draftProducts.length > 0 &&
    selectedCategory !== INVENTORY_DRAFTS_FILTER &&
    selectedCategory === 'All';

  const handleRemove = (product: InventoryProduct) => {
    Alert.alert(
      'Remove product',
      `Remove ${product.name || 'this product'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeProduct(product.id),
        },
      ],
    );
  };

  const handleDeleteDraft = (product: InventoryProduct) => {
    Alert.alert(
      'Delete draft',
      `Delete draft "${product.name || 'Untitled'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeProduct(product.id),
        },
      ],
    );
  };

  const listTitle = selectedCategory === INVENTORY_DRAFTS_FILTER ? 'Draft Products' : 'Inventory Insights';

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <View className="px-5">
        <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
          Inventory
        </Text>
        <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>My Products engagement</Text>
      </View>

      <View style={{ flexGrow: 0, marginTop: 16 }}>
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
          {FILTER_CATEGORIES.map((category) => {
            const isActive = category === selectedCategory;
            return (
              <Pressable
                key={category}
                onPress={() => setCategory(category)}
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
                  {category}
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
      >
        {showDraftsSection ? (
          <View className="mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
                Drafts
              </Text>
              <Text style={{ fontSize: micro, color: colors.GOLD }}>
                {draftProducts.length} incomplete
              </Text>
            </View>
            {draftProducts.map((product) => (
              <DraftCard
                key={product.id}
                product={product}
                width={width}
                body={body}
                label={label}
                onComplete={() =>
                  router.push({
                    pathname: '/(app)/inventory/add',
                    params: { productId: product.id },
                  })
                }
                onDelete={() => handleDeleteDraft(product)}
              />
            ))}
          </View>
        ) : null}

        <Text className="mb-3 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          {listTitle}
        </Text>

        {filteredProducts.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="diamond-outline" size={48} color={colors.BODY_TEXT} />
            <Text className="mt-3" style={{ fontSize: body, color: colors.BODY_TEXT }}>
              {selectedCategory === INVENTORY_DRAFTS_FILTER
                ? 'No draft products yet'
                : `No products in ${selectedCategory}`}
            </Text>
            <Pressable
              onPress={() => router.push('/(app)/inventory/add')}
              className="mt-4 rounded-full px-4 py-2"
              style={{ backgroundColor: colors.NAVY }}
            >
              <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
                Add Product
              </Text>
            </Pressable>
          </View>
        ) : selectedCategory === INVENTORY_DRAFTS_FILTER ? (
          filteredProducts.map((product) => (
            <DraftCard
              key={product.id}
              product={product}
              width={width}
              body={body}
              label={label}
              onComplete={() =>
                router.push({
                  pathname: '/(app)/inventory/add',
                  params: { productId: product.id },
                })
              }
              onDelete={() => handleDeleteDraft(product)}
            />
          ))
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              width={width}
              body={body}
              label={label}
              micro={micro}
              onRemove={() => handleRemove(product)}
              onEdit={() =>
                router.push({
                  pathname: '/(app)/inventory/edit',
                  params: { productId: product.id },
                })
              }
            />
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/(app)/inventory/add')}
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
    </View>
  );
}
