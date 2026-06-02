import { Image as ExpoImage, type ImageContentFit } from 'expo-image';
import { type ImageStyle, type StyleProp } from 'react-native';

type CachedImageProps = {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  className?: string;
  accessibilityLabel?: string;
};

const contentFitMap: Record<NonNullable<CachedImageProps['resizeMode']>, ImageContentFit> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  center: 'none',
};

export function CachedImage({
  source,
  style,
  resizeMode = 'cover',
  className,
  accessibilityLabel,
}: CachedImageProps) {
  const contentFit = contentFitMap[resizeMode];

  if (typeof source === 'number') {
    return (
      <ExpoImage
        source={source}
        style={style}
        contentFit={contentFit}
        className={className}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <ExpoImage
      source={source}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      recyclingKey={source.uri}
      className={className}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
