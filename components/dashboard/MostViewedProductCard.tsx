import { CachedImage } from '@components/ui/CachedImage';
import { DiamondIcon } from '@components/ui/DiamondIcon';
import { colors } from '@constants/colors';
import type { InventoryProduct } from '@/types/inventory';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

type MostViewedProductCardProps = {
  product: InventoryProduct;
  cardWidth: number;
  body: number;
  micro: number;
  onPress: () => void;
};

export const MostViewedProductCard = memo(function MostViewedProductCard({
  product,
  cardWidth,
  body,
  micro,
  onPress,
}: MostViewedProductCardProps) {
  const statusLabel = product.isDraft || product.status === 'draft' ? 'Draft' : 'Active';

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 overflow-hidden rounded-2xl border"
      style={{
        width: cardWidth,
        borderColor: colors.BORDER,
        backgroundColor: colors.WHITE,
      }}
    >
      {product.imageUri ? (
        <CachedImage
          source={{ uri: product.imageUri }}
          style={{ width: cardWidth, height: cardWidth * 0.72 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{
            width: cardWidth,
            height: cardWidth * 0.72,
            backgroundColor: colors.SURFACE_MUTED,
          }}
        >
          <DiamondIcon size={28} containerSize={48} containerColor={colors.SURFACE_MUTED} color={colors.GOLD} />
        </View>
      )}
      <View className="p-3">
        <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={{ fontSize: micro, color: colors.BODY_TEXT, marginTop: 2 }}>
          {product.analytics.views.toLocaleString('en-IN')} views
        </Text>
        <View
          className="mt-2 self-start rounded-full px-2 py-0.5"
          style={{
            backgroundColor:
              statusLabel === 'Active' ? colors.INFO_BG : colors.SURFACE_MUTED,
          }}
        >
          <Text
            style={{
              fontSize: micro,
              color: statusLabel === 'Active' ? colors.NAVY : colors.BODY_TEXT,
              fontWeight: '600',
            }}
          >
            {statusLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
