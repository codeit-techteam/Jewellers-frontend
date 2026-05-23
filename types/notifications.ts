import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type NotificationUiType = 'lead' | 'order' | 'system';

export type AppNotification = {
  id: string;
  type: NotificationUiType;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
};

export type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};
