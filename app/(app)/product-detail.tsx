import { DiamondIcon } from '@components/ui/DiamondIcon';
import { colors } from '@constants/colors';
import { getProduct } from '@services/inventoryService';
import type { InventoryProduct } from '@/types/inventory';
import { useInventoryStore } from '@store/useInventoryStore';
import { useProfileStore } from '@store/useProfileStore';
import { formatInr } from '@utils/formatCurrency';
import { handleApiError } from '@utils/handleApiError';
import { dialog } from '@utils/dialog';
import { showShareComingSoonAlert } from '@utils/storeAlerts';
import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import { navigateBack } from '@lib/navigateBack';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { productId, returnTo } = useLocalSearchParams<{
    productId: string;
    returnTo?: string;
  }>();

  const h1 = width * 0.055;
  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;
  const button = width * 0.042;

  const storeProduct = useInventoryStore((state) =>
    productId ? state.products.find((item) => item.id === productId) : undefined,
  );
  const incrementWaClick = useInventoryStore((state) => state.incrementWaClick);
  const incrementInquiry = useInventoryStore((state) => state.incrementInquiry);
  const profile = useProfileStore((state) => state.profile);

  const [product, setProduct] = useState<InventoryProduct | undefined>(storeProduct);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProduct = async () => {
    if (!productId) return;
    setLoadError(null);
    try {
      const fetched = await getProduct(productId);
      setProduct(fetched);
    } catch (err) {
      setLoadError(handleApiError(err));
    }
  };

  useEffect(() => {
    if (!productId) {
      navigateBack(router, returnTo);
      return;
    }
    if (storeProduct) {
      setProduct(storeProduct);
      return;
    }
    void loadProduct();
  }, [productId, returnTo, router, storeProduct]);

  if (!productId) {
    return null;
  }

  if (loadError && !product) {
    return (
      <ErrorScreen
        message={loadError}
        onRetry={() => void loadProduct()}
      />
    );
  }

  if (!product) {
    return <LoadingScreen message="Loading product…" />;
  }

  const profilePhone = profile.phone;
  const waPhone = profilePhone.replace(/\D/g, '');
  const makingLabel =
    product.makingChargesType === 'percentage'
      ? `${product.makingChargesValue}%`
      : formatInr(product.makingChargesValue);

  const description =
    product.additionalDetails?.trim() ||
    `Handcrafted with precision, this piece features certified ${product.purity} purity. Each item is quality checked and comes with authenticity documentation.`;

  const handleCall = () => {
    void Linking.openURL(`tel:${profilePhone}`);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi, I am interested in ${product.name} (SKU: ${product.sku}). Please share details.`,
    );
    void Linking.openURL(`https://wa.me/${waPhone}?text=${message}`);
    incrementWaClick(product.id);
  };

  const handleBookAppointment = () => {
    incrementInquiry(product.id);
    void dialog.alert(
      'Appointment booking coming soon',
      `We will contact you shortly at ${profilePhone}`,
    );
  };

  const statItems = [
    { label: 'Views', value: product.analytics.views },
    { label: 'Wishlist', value: product.analytics.wishlist },
    { label: 'Inquiry', value: product.analytics.inquiry },
    { label: 'WA Click', value: product.analytics.waClicks },
  ];

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
          style={{ fontSize: h2, color: colors.NAVY }}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <View className="flex-row items-center">
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(app)/inventory/edit',
                params: { productId },
              })
            }
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="create-outline" size={width * 0.05} color={colors.NAVY} />
          </Pressable>
          <Pressable
            onPress={showShareComingSoonAlert}
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="share-outline" size={width * 0.055} color={colors.NAVY} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: width * 0.85 }}>
          {product.imageUri ? (
            <Image
              source={{ uri: product.imageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="items-center justify-center"
              style={{ flex: 1, backgroundColor: colors.SURFACE_MUTED }}
            >
              <DiamondIcon
                size={width * 0.12}
                containerSize={width * 0.22}
                containerColor={colors.SURFACE_MUTED}
                color={colors.BODY_TEXT}
              />
            </View>
          )}
        </View>

        <View
          className="rounded-t-3xl bg-white px-5 pb-6 pt-5"
          style={{ marginTop: -24 }}
        >
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
              {product.name}
            </Text>
            <Text className="font-bold" style={{ fontSize: h1, color: colors.NAVY }}>
              {formatInr(product.price)}
            </Text>
          </View>
          <Text className="mt-1" style={{ fontSize: label, color: colors.BODY_TEXT }}>
            SKU: {product.sku}
          </Text>

          <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
            {[`${product.weight}g`, product.purity, product.category].map((pill) => (
              <View
                key={pill}
                className="rounded-lg px-3 py-2"
                style={{ backgroundColor: colors.SURFACE_MUTED }}
              >
                <Text style={{ fontSize: label, color: colors.NAVY }}>{pill}</Text>
              </View>
            ))}
          </View>

          <Text className="mt-3" style={{ fontSize: label, color: colors.BODY_TEXT }}>
            Making Charges: {makingLabel}
          </Text>

          <View className="my-4 h-px" style={{ backgroundColor: colors.BORDER }} />

          <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
            Product Details
          </Text>
          <Text className="mt-2 leading-relaxed" style={{ fontSize: body, color: colors.BODY_TEXT }}>
            {description}
          </Text>

          <View
            className="mt-4 rounded-xl p-3"
            style={{ backgroundColor: colors.SURFACE_MUTED }}
          >
            <Text
              className="mb-2 uppercase tracking-wider"
              style={{ fontSize: micro, color: colors.BODY_TEXT }}
            >
              Product Insights
            </Text>
            <View className="flex-row">
              {statItems.map((stat) => (
                <View key={stat.label} className="flex-1 items-center">
                  <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>{stat.label}</Text>
                  <Text className="font-bold" style={{ fontSize: label, color: colors.NAVY }}>
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text
            className="mb-3 mt-5 font-bold uppercase tracking-wider"
            style={{ fontSize: micro, color: colors.BODY_TEXT }}
          >
            Enquire About This Product
          </Text>

          <Pressable
            onPress={handleCall}
            className="mb-2 items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: colors.NAVY }}
          >
            <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
              📞 Call Now
            </Text>
          </Pressable>

          <Pressable
            onPress={handleWhatsApp}
            className="mb-2 items-center justify-center rounded-xl py-4"
            style={{ backgroundColor: colors.WHATSAPP }}
          >
            <Text className="font-semibold" style={{ fontSize: button, color: colors.WHITE }}>
              💬 WhatsApp Enquiry
            </Text>
          </Pressable>

          <Pressable
            onPress={handleBookAppointment}
            className="items-center justify-center rounded-xl border py-4"
            style={{ borderColor: colors.NAVY }}
          >
            <Text className="font-semibold" style={{ fontSize: button, color: colors.NAVY }}>
              📅 Book Appointment
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
