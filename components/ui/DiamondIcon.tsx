import { colors } from '@constants/colors';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type DiamondIconProps = {
  size?: number;
  color?: string;
  containerColor?: string;
  containerSize?: number;
};

export function DiamondIcon({
  size = 28,
  color = colors.GOLD,
  containerColor = colors.NAVY,
  containerSize = 56,
}: DiamondIconProps) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: containerSize,
        height: containerSize,
        backgroundColor: containerColor,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2L4 9L12 22L20 9L12 2Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <Path
          d="M4 9H20M8.5 9L12 2L15.5 9M8.5 9L12 22M15.5 9L12 22"
          stroke={color}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
