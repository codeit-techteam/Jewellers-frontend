/* eslint-disable react-hooks/immutability -- Reanimated shared values */
import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outlined';
  showArrow?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'filled',
  showArrow = false,
}: PrimaryButtonProps) {
  const { button } = useFontScale();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || isLoading;
  const isFilled = variant === 'filled';

  const backgroundColor = isFilled
    ? isDisabled
      ? `${colors.NAVY}99`
      : colors.NAVY
    : 'transparent';

  const textColor = isFilled ? colors.WHITE : colors.WHITE;
  const borderColor = isFilled ? 'transparent' : colors.WHITE;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        if (!isDisabled) {
          // Reanimated shared value — safe to assign in gesture handlers
          scale.value = withSpring(0.97);
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={animatedStyle}
      className="w-full items-center justify-center rounded-xl"
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <View
        className="w-full flex-row items-center justify-center rounded-xl"
        style={{
          backgroundColor,
          borderWidth: isFilled ? 0 : 1,
          borderColor,
          paddingVertical: 16,
          opacity: isDisabled && !isFilled ? 0.6 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color={isFilled ? colors.WHITE : colors.NAVY} />
        ) : (
          <Text className="font-semibold" style={{ fontSize: button, color: textColor }}>
            {label}
            {showArrow ? ' →' : ''}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}
