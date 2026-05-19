import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export function useFontScale() {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => ({
      width,
      height,
      hero: width * 0.16,
      h1: width * 0.075,
      h2: width * 0.058,
      body: width * 0.038,
      label: width * 0.032,
      micro: width * 0.028,
      button: width * 0.042,
    }),
    [width, height],
  );
}
