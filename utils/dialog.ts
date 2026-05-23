import type { DialogButton, DialogVariant } from '@components/ui/AppDialog';
import { getDialog } from '@providers/DialogProvider';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Drop-in replacement for React Native Alert.alert with branded UI.
 */
export const dialog = {
  alert(title: string, message?: string, buttons?: AlertButton[]): Promise<void> {
    const mapped: DialogButton[] =
      buttons && buttons.length > 0
        ? buttons.map((b) => ({
            text: b.text,
            style:
              b.style === 'cancel'
                ? 'cancel'
                : b.style === 'destructive'
                  ? 'destructive'
                  : b.style === 'default'
                    ? 'primary'
                    : 'primary',
            onPress: b.onPress,
          }))
        : [{ text: 'OK', style: 'primary' as const }];

    return getDialog().show({
      title,
      message,
      variant: mapped.some((b) => b.style === 'destructive') ? 'destructive' : 'info',
      buttons: mapped,
    });
  },

  confirm(
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
      onConfirm?: () => void | Promise<void>;
    },
  ): Promise<boolean> {
    return getDialog().confirm(title, message, options);
  },

  show(options: {
    title: string;
    message?: string;
    variant?: DialogVariant;
    buttons: AlertButton[];
  }): Promise<void> {
    return this.alert(options.title, options.message, options.buttons);
  },
};
