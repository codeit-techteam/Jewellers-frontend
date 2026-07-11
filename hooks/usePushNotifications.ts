import { useEffect } from 'react';
import { AppState } from 'react-native';

import {
  attachPushNotificationListeners,
  syncPushTokenForUser,
} from '@lib/pushNotifications';
import { useAuthStore } from '@store/useAuthStore';

export function usePushNotificationsBootstrap(): void {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    void syncPushTokenForUser(userId);
    const detach = attachPushNotificationListeners();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncPushTokenForUser(userId);
      }
    });

    return () => {
      detach();
      sub.remove();
    };
  }, [isAuthenticated, userId]);
}
