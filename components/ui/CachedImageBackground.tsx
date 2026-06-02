import { Image as ExpoImage } from 'expo-image';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

type CachedImageBackgroundProps = {
  source: { uri: string } | number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  className?: string;
  children?: ReactNode;
};

const contentFitMap = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  center: 'none',
} as const;

export function CachedImageBackground({
  source,
  style,
  imageStyle,
  resizeMode = 'cover',
  className,
  children,
}: CachedImageBackgroundProps) {
  return (
    <View style={style} className={className}>
      <ExpoImage
        source={source}
        style={[StyleSheet.absoluteFillObject, imageStyle]}
        contentFit={contentFitMap[resizeMode]}
        cachePolicy={typeof source === 'number' ? undefined : 'memory-disk'}
        recyclingKey={typeof source === 'number' ? undefined : source.uri}
      />
      {children}
    </View>
  );
}
