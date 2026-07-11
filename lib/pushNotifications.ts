import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { isRunningInExpoGo } from 'expo';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';

import { registerPushToken } from '@services/notificationsService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePushPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

function resolveEasProjectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    process.env.EAS_PROJECT_ID ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Jewellars Partner',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function getNativeFcmToken(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  if (__DEV__ && isRunningInExpoGo()) return null;

  const granted = await ensurePushPermissions();
  if (!granted) return null;

  await ensureAndroidChannel();

  const deviceToken = await Notifications.getDevicePushTokenAsync();
  const token = deviceToken?.data;
  return typeof token === 'string' && token.trim() ? token : null;
}

export async function getExpoPushToken(): Promise<string | null> {
  if (__DEV__ && isRunningInExpoGo() && Platform.OS === 'android') {
    console.warn(
      '[push] Android push tokens are not supported in Expo Go (SDK 53+). Use an EAS build.',
    );
    return null;
  }

  const granted = await ensurePushPermissions();
  if (!granted) {
    if (__DEV__) {
      console.warn('[push] Notification permission not granted');
    }
    return null;
  }

  await ensureAndroidChannel();

  const projectId = resolveEasProjectId();
  if (!projectId) {
    if (__DEV__) {
      console.warn('[push] Missing EAS projectId in app.json extra.eas.projectId');
    }
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data ?? null;
}

export async function syncPushTokenForUser(userId: string): Promise<void> {
  try {
    const registrations: Array<{
      token: string;
      platform: string;
      provider: 'fcm' | 'expo';
    }> = [];

    const fcmToken = await getNativeFcmToken();
    if (fcmToken) {
      registrations.push({ token: fcmToken, platform: Platform.OS, provider: 'fcm' });
    }

    const expoToken = await getExpoPushToken();
    if (expoToken) {
      registrations.push({ token: expoToken, platform: Platform.OS, provider: 'expo' });
    }

    if (registrations.length === 0) {
      if (__DEV__) {
        console.warn('[push] No push tokens available on this device/build');
      }
      return;
    }

    for (const entry of registrations) {
      await registerPushToken(entry);
    }

    if (__DEV__) {
      console.log('[push] Tokens saved for user', userId, registrations);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[push] Failed to register token', error);
    }
  }
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function attachPushNotificationListeners() {
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
    const type = asOptionalString(data.type);

    if (type === 'lead') {
      router.push('/(app)/leads');
      return;
    }

    router.push('/(app)/notifications');
  });

  return () => {
    responseSub.remove();
  };
}
