import { colors } from '@constants/colors';
import type { AppNotification, NotificationsResponse, NotificationUiType } from '@/types/notifications';

import { api, ApiError } from './api';

type BackendNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

const BACKEND_TO_UI: Record<string, NotificationUiType> = {
  lead: 'lead',
  order: 'order',
  system: 'system',
  document: 'system',
  payment: 'system',
  approval: 'system',
  onboarding: 'system',
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'Yesterday' : `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function iconForType(type: NotificationUiType): Pick<AppNotification, 'icon' | 'iconColor'> {
  switch (type) {
    case 'order':
      return { icon: 'chatbubble-outline', iconColor: colors.SUCCESS };
    case 'lead':
      return { icon: 'calendar-outline', iconColor: colors.NAVY };
    default:
      return { icon: 'notifications-outline', iconColor: colors.NAVY };
  }
}

export function mapBackendNotification(row: BackendNotification): AppNotification {
  const uiType = BACKEND_TO_UI[row.type] ?? 'system';
  return {
    id: row.id,
    type: uiType,
    rawType: row.type,
    title: row.title,
    body: row.body,
    time: formatRelativeTime(row.created_at),
    isRead: row.is_read,
    ...iconForType(uiType),
  };
}

export async function getNotifications(type?: string): Promise<NotificationsResponse> {
  try {
    const { data } = await api.get<{
      notifications: BackendNotification[];
      unreadCount: number;
    }>('/notifications', { params: type ? { type } : undefined });

    const rows = data.notifications ?? [];
    return {
      notifications: rows.map(mapBackendNotification),
      unreadCount: data.unreadCount ?? 0,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load notifications');
  }
}

export async function markAllRead(): Promise<void> {
  try {
    await api.patch('/notifications/read-all');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to mark notifications as read');
  }
}

export async function markRead(id: string): Promise<void> {
  try {
    await api.patch(`/notifications/${id}/read`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to mark notification as read');
  }
}

export async function deleteNotification(id: string): Promise<void> {
  try {
    await api.delete(`/notifications/${id}`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to delete notification');
  }
}

export async function registerPushToken(input: {
  token: string;
  platform?: string;
  provider?: 'fcm' | 'expo';
}): Promise<void> {
  try {
    await api.post('/notifications/push-token', input);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to register push token');
  }
}

export async function sendTestPushNotification(input?: {
  title?: string;
  body?: string;
}): Promise<{
  sent: number;
  fcm: number;
  expo: number;
  tokenCount: number;
  message: string;
  fcmConfigured?: boolean;
}> {
  try {
    const { data } = await api.post<{
      sent: number;
      fcm: number;
      expo: number;
      tokenCount: number;
      message: string;
      fcmConfigured?: boolean;
    }>('/notifications/push-test', input ?? {});
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to send test push');
  }
}

export async function getPushStatus(): Promise<{
  tokenCount: number;
  providers: string[];
  platforms: string[];
  fcmConfigured: boolean;
}> {
  try {
    const { data } = await api.get<{
      tokenCount: number;
      providers: string[];
      platforms: string[];
      fcmConfigured: boolean;
    }>('/notifications/push-status');
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to load push status');
  }
}
