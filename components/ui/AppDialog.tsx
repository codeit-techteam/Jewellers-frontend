import { colors } from '@constants/colors';
import { useFontScale } from '@hooks/useFontScale';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive' | 'primary';

export type DialogButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: DialogButtonStyle;
};

export type DialogVariant = 'default' | 'destructive' | 'info' | 'success' | 'warning';

export type AppDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  variant?: DialogVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  buttons: DialogButton[];
  onDismiss: () => void;
  loading?: boolean;
};

const VARIANT_CONFIG: Record<
  DialogVariant,
  { icon: keyof typeof Ionicons.glyphMap; iconBg: string; iconColor: string }
> = {
  default: { icon: 'information-circle', iconBg: colors.INFO_BG, iconColor: colors.INFO },
  destructive: { icon: 'trash-outline', iconBg: '#FEE2E2', iconColor: colors.ERROR },
  info: { icon: 'information-circle', iconBg: colors.INFO_BG, iconColor: colors.INFO },
  success: { icon: 'checkmark-circle', iconBg: '#D1FAE5', iconColor: colors.SUCCESS },
  warning: { icon: 'warning', iconBg: colors.TIP_BG, iconColor: colors.AMBER },
};

export function AppDialog({
  visible,
  title,
  message,
  variant = 'default',
  icon,
  buttons,
  onDismiss,
  loading = false,
}: AppDialogProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { h2, body, label } = useFontScale();

  const config = VARIANT_CONFIG[variant];
  const iconName = icon ?? config.icon;

  const primaryButtons = buttons.filter((b) => b.style !== 'cancel');
  const cancelButtons = buttons.filter((b) => b.style === 'cancel');
  const stacked = buttons.length > 2;

  const renderButton = (button: DialogButton, index: number) => {
    const isCancel = button.style === 'cancel';
    const isDestructive = button.style === 'destructive';
    const isPrimary = button.style === 'primary' || (!isCancel && !isDestructive && primaryButtons.length === 1);

    if (isCancel) {
      return (
        <Pressable
          key={`${button.text}-${index}`}
          onPress={() => {
            button.onPress?.();
            onDismiss();
          }}
          disabled={loading}
          className="flex-1 items-center justify-center rounded-xl border py-3"
          style={{ borderColor: colors.BORDER, minHeight: 48, backgroundColor: colors.WHITE }}
          accessibilityRole="button"
        >
          <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
            {button.text}
          </Text>
        </Pressable>
      );
    }

    if (isDestructive) {
      return (
        <Pressable
          key={`${button.text}-${index}`}
          onPress={() => {
            void button.onPress?.();
            onDismiss();
          }}
          disabled={loading}
          className="flex-1 items-center justify-center rounded-xl py-3"
          style={{ backgroundColor: colors.ERROR, minHeight: 48, opacity: loading ? 0.7 : 1 }}
          accessibilityRole="button"
        >
          <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
            {button.text}
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={`${button.text}-${index}`}
        onPress={() => {
          void button.onPress?.();
          onDismiss();
        }}
        disabled={loading}
        className="flex-1 items-center justify-center rounded-xl py-3"
        style={{
          backgroundColor: isPrimary ? colors.NAVY : colors.WHITE,
          borderWidth: isPrimary ? 0 : 1,
          borderColor: colors.BORDER,
          minHeight: 48,
          opacity: loading ? 0.7 : 1,
        }}
        accessibilityRole="button"
      >
        <Text
          className="font-semibold"
          style={{ fontSize: label, color: isPrimary ? colors.WHITE : colors.NAVY }}
        >
          {button.text}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: colors.OVERLAY_DARK, paddingBottom: insets.bottom }}
        onPress={loading || buttons.length > 1 ? undefined : onDismiss}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full overflow-hidden rounded-2xl bg-white"
          style={{ maxWidth: Math.min(width - 48, 360), shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 }}
        >
          <View className="items-center px-6 pb-2 pt-6">
            <View
              className="mb-4 items-center justify-center rounded-full"
              style={{
                width: width * 0.14,
                height: width * 0.14,
                backgroundColor: config.iconBg,
              }}
            >
              <Ionicons name={iconName} size={width * 0.07} color={config.iconColor} />
            </View>

            <Text className="text-center font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
              {title}
            </Text>

            {message ? (
              <Text
                className="mt-2 text-center leading-5"
                style={{ fontSize: body, color: colors.BODY_TEXT }}
              >
                {message}
              </Text>
            ) : null}

            {loading ? (
              <ActivityIndicator color={colors.NAVY} style={{ marginTop: 16 }} />
            ) : null}
          </View>

          <View className="px-4 pb-5 pt-3" style={{ gap: stacked ? 8 : 10 }}>
            {stacked ? (
              buttons.map((button, index) => renderButton(button, index))
            ) : (
              <>
                {cancelButtons.length > 0 || primaryButtons.length > 1 ? (
                  <View className="flex-row" style={{ gap: 10 }}>
                    {cancelButtons.map((b, i) => renderButton(b, i))}
                    {primaryButtons.map((b, i) => renderButton(b, i + cancelButtons.length))}
                  </View>
                ) : (
                  buttons.map((button, index) => renderButton(button, index))
                )}
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
