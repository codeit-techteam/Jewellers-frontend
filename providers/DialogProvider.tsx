import { AppDialog, type AppDialogProps, type DialogButton, type DialogVariant } from '@components/ui/AppDialog';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type ShowDialogOptions = {
  title: string;
  message?: string;
  variant?: DialogVariant;
  icon?: AppDialogProps['icon'];
  buttons: DialogButton[];
};

type DialogContextValue = {
  show: (options: ShowDialogOptions) => Promise<void>;
  alert: (title: string, message?: string) => Promise<void>;
  confirm: (
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
      onConfirm?: () => void | Promise<void>;
      onCancel?: () => void;
    },
  ) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

let dialogApi: DialogContextValue | null = null;

/** Imperative API for use outside React components (e.g. utils). */
export function getDialog(): DialogContextValue {
  if (!dialogApi) {
    return {
      show: async () => undefined,
      alert: async () => undefined,
      confirm: async () => false,
    };
  }
  return dialogApi;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShowDialogOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setState(null);
      resolveRef.current?.();
      resolveRef.current = null;
    }, 200);
  }, []);

  const show = useCallback((options: ShowDialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState(options);
      setVisible(true);
    });
  }, []);

  const alert = useCallback(
    (title: string, message?: string) =>
      show({
        title,
        message,
        variant: 'info',
        buttons: [{ text: 'OK', style: 'primary' }],
      }),
    [show],
  );

  const confirm = useCallback(
    (
      title: string,
      message: string,
      options?: {
        confirmText?: string;
        cancelText?: string;
        destructive?: boolean;
        onConfirm?: () => void | Promise<void>;
        onCancel?: () => void;
      },
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        void show({
          title,
          message,
          variant: options?.destructive ? 'destructive' : 'default',
          buttons: [
            {
              text: options?.cancelText ?? 'Cancel',
              style: 'cancel',
              onPress: () => {
                options?.onCancel?.();
                resolve(false);
              },
            },
            {
              text: options?.confirmText ?? 'Confirm',
              style: options?.destructive ? 'destructive' : 'primary',
              onPress: async () => {
                await options?.onConfirm?.();
                resolve(true);
              },
            },
          ],
        });
      });
    },
    [show],
  );

  const value: DialogContextValue = { show, alert, confirm };

  useEffect(() => {
    dialogApi = value;
    return () => {
      dialogApi = null;
    };
  }, [value]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {state ? (
        <AppDialog
          visible={visible}
          title={state.title}
          message={state.message}
          variant={state.variant}
          icon={state.icon}
          buttons={state.buttons}
          onDismiss={dismiss}
        />
      ) : null}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return ctx;
}
