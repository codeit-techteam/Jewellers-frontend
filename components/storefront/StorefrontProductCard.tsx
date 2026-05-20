import { DiamondIcon } from '@components/ui/DiamondIcon';
import { colors } from '@constants/colors';
import type { StorefrontDisplayProduct } from '@utils/buildStorefrontInventoryProducts';
import { formatInr } from '@utils/formatCurrency';
import { Image, Pressable, Text, View } from 'react-native';

type StorefrontProductCardProps = {
  product: StorefrontDisplayProduct;
  width: number;
  nameSize: number;
  label: number;
  onViewDetails: () => void;
};

export function StorefrontProductCard({
  product,
  width,
  nameSize,
  label,
  onViewDetails,
}: StorefrontProductCardProps) {
  const imageHeight = width * 0.45;
  const hasImage = Boolean(product.imageUri);

  return (
    <View
      className="mb-3 overflow-hidden rounded-xl border"
      style={{
        width: '48%',
        borderColor: colors.BORDER,
        backgroundColor: colors.WHITE,
      }}
    >
      <View style={{ height: imageHeight }}>
        {hasImage ? (
          <Image
            source={{ uri: product.imageUri }}
            style={{ width: '100%', height: imageHeight }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{
              width: '100%',
              height: imageHeight,
              backgroundColor: colors.SURFACE_MUTED,
            }}
          >
            <DiamondIcon
              size={width * 0.08}
              containerSize={width * 0.16}
              containerColor={colors.SURFACE_MUTED}
              color={colors.BODY_TEXT}
            />
          </View>
        )}
      </View>
      <View className="p-2.5">
        <Text className="font-bold" style={{ fontSize: nameSize, color: colors.NAVY }} numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="mt-1 font-bold" style={{ fontSize: nameSize, color: colors.NAVY }}>
          {formatInr(product.price)}
        </Text>
        <Pressable
          onPress={onViewDetails}
          className="mt-1.5 items-center justify-center rounded-lg py-2"
          style={{ backgroundColor: colors.NAVY }}
        >
          <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
            VIEW DETAILS
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
