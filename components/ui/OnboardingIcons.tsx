import { colors } from '@constants/colors';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function StoreIcon({ size = 20, color = colors.BODY_TEXT }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10L12 4L20 10V20H4V10Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Rect x="9" y="14" width="6" height="6" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function PersonIcon({ size = 20, color = colors.BODY_TEXT }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.5} />
      <Path
        d="M6 20C6 16.6863 8.68629 14 12 14C15.3137 14 18 16.6863 18 20"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PhoneIcon({ size = 20, color = colors.BODY_TEXT }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4H16C17.1046 4 18 4.89543 18 6V18C18 19.1046 17.1046 20 16 20H8C6.89543 20 6 19.1046 6 18V6C6 4.89543 6.89543 4 8 4Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

export function LocationIcon({ size = 20, color = colors.BODY_TEXT }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 18 14.5 18 10C18 6.68629 15.3137 4 12 4C8.68629 4 6 6.68629 6 10C6 14.5 12 21 12 21Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function CloudUploadIcon({ size = 28, color = colors.NAVY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 16V8M12 8L9 11M12 8L15 11"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 18H18C19.6569 18 21 16.6569 21 15C21 13.3431 19.6569 12 18 12C17.5 8.5 14.5 6 11 6C8.5 6 6.5 7.5 5.5 9.5C3.5 9.8 2 11.5 2 13.5C2 16 4 18 6 18Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 20, color = colors.NAVY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L5 6V11C5 15.5 8.5 19.2 12 21C15.5 19.2 19 15.5 19 11V6L12 3Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InfoIcon({ size = 20, color = colors.NAVY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} />
      <Path d="M12 10V16" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx="12" cy="7.5" r="1" fill={color} />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 18, color = colors.SUCCESS }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={color} />
      <Path
        d="M8 12L11 15L16 9"
        stroke={colors.WHITE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 20, color = colors.BODY_TEXT }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 7H18M9 7V5H15V7M10 11V16M14 11V16M8 7L9 19H15L16 7"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WalletIcon({ size = 22, color = colors.NAVY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8H20C21.1046 8 22 8.89543 22 10V16C22 17.1046 21.1046 18 20 18H4C2.89543 18 2 17.1046 2 16V10C2 8.89543 2.89543 8 4 8Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path d="M16 13H18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function CreditCardIcon({ size = 22, color = colors.NAVY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8H21V18H3V8Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M3 11H21" stroke={color} strokeWidth={1.5} />
      <Path d="M6 15H10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 16, color = colors.BODY_TEXT }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4V2M17 4V2M4 9H20M6 6H18C19.1046 6 20 6.89543 20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function DocumentIcon({ size = 24, color = colors.NAVY }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4H14L18 8V20H8V4Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M14 4V8H18" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}
