import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { colors } from '@constants/colors';
import {
  deleteNotification as deleteNotificationApi,
  getNotifications,
  markAllRead,
  markRead,
  sendTestPushNotification,
} from '@services/notificationsService';
import { syncPushTokenForUser } from '@lib/pushNotifications';
import { useAuthStore } from '@store/useAuthStore';
import type { NotificationsResponse } from '@/types/notifications';
import type { AppNotification } from '@/types/notifications';
import { handleApiError } from '@utils/handleApiError';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';
import { usePullToRefresh } from '@hooks/usePullToRefresh';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { dialog } from '@utils/dialog';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NotificationFilter = 'All' | 'Leads' | 'System';

const FILTER_PILLS: NotificationFilter[] = ['All', 'Leads', 'System'];

function filterTypeForPill(pill: NotificationFilter): string | undefined {
  if (pill === 'Leads') return 'lead';
  return undefined;
}

type NotificationRowProps = {
  item: AppNotification;
  body: number;
  label: number;
  micro: number;
  onPress: () => void;
  onDelete: () => void;
  onSwipeOpen: () => void;
  swipeableRef: (ref: Swipeable | null) => void;
};

const NotificationRow = memo(function NotificationRow({
  item,
  body,
  label,
  micro,
  onPress,
  onDelete,
  onSwipeOpen,
  swipeableRef,
}: NotificationRowProps) {
  return (
    <Swipeable
      ref={swipeableRef}
      overshootRight={false}
      friction={2}
      rightThreshold={48}
      onSwipeableWillOpen={onSwipeOpen}
      renderRightActions={() => (
        <Pressable
          onPress={onDelete}
          hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
          className="mb-2 items-center justify-center rounded-xl"
          style={{
            width: 88,
            marginLeft: 8,
            paddingHorizontal: 20,
            backgroundColor: colors.ERROR,
          }}
        >
          <Ionicons name="trash-outline" size={22} color={colors.WHITE} />
          <Text className="mt-1 font-semibold" style={{ fontSize: micro, color: colors.WHITE }}>
            Delete
          </Text>
        </Pressable>
      )}
    >
      <Pressable
        onPress={onPress}
        className="mb-2 flex-row items-start rounded-xl border p-3"
        style={{
          borderColor: colors.BORDER,
          backgroundColor: item.isRead ? colors.WHITE : `${colors.NAVY}08`,
        }}
      >
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.INFO_BG,
          }}
        >
          <Ionicons name={item.icon} size={20} color={item.iconColor} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
            {item.title}
          </Text>
          <Text className="mt-1" style={{ fontSize: label, color: colors.BODY_TEXT }}>
            {item.body}
          </Text>
          <Text className="mt-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            {item.time}
          </Text>
        </View>
        {!item.isRead ? (
          <View
            className="rounded-full"
            style={{ width: 8, height: 8, backgroundColor: colors.INFO }}
          />
        ) : null}
      </Pressable>
    </Swipeable>
  );
});

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  const storeStatus = useOnboardingStore((state) => state.storeStatus);

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('All');
  const [isTestingPush, setIsTestingPush] = useState(false);
  const userId = useAuthStore((state) => state.user?.id);
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  const apiType = filterTypeForPill(activeFilter);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', activeFilter],
    queryFn: () => getNotifications(apiType),
  });

  const { data, isPending, isError, error, refetch } = notificationsQuery;
  const { isRefreshing: isNotificationsRefreshing, onRefresh: onNotificationsRefresh } =
    usePullToRefresh([notificationsQuery]);

  const notifications = data?.notifications ?? [];
  const filteredNotifications =
    activeFilter === 'System'
      ? notifications.filter((item) => item.type === 'system')
      : notifications;

  const handleMarkAllRead = () => {
    void (async () => {
      try {
        await markAllRead();
        await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (err) {
        void dialog.alert('Error', handleApiError(err));
      }
    })();
  };

  const handleToggleRead = (id: string) => {
    void (async () => {
      try {
        await markRead(id);
        await refetch();
      } catch (err) {
        void dialog.alert('Error', handleApiError(err));
      }
    })();
  };

  const handleDeleteNotification = useCallback(
    (item: AppNotification) => {
      swipeableRefs.current.get(item.id)?.close();
      swipeableRefs.current.delete(item.id);

      const previousQueries = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: ['notifications'],
      });

      queryClient.setQueriesData<NotificationsResponse>(
        { queryKey: ['notifications'] },
        (old) => {
          if (!old) return old;
          const notifications = old.notifications.filter((n) => n.id !== item.id);
          const unreadCount =
            !item.isRead && old.unreadCount > 0 ? old.unreadCount - 1 : old.unreadCount;
          return { notifications, unreadCount };
        },
      );

      void deleteNotificationApi(item.id).catch((err) => {
        previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
        void dialog.alert('Error', handleApiError(err));
      });
    },
    [queryClient],
  );

  const handleNotificationPress = (item: AppNotification) => {
    handleToggleRead(item.id);
    if (item.rawType === 'approval') {
      if (storeStatus === 'approved') {
        router.push('/(app)');
      } else {
        router.push('/(onboarding)/review-pending');
      }
    } else if (item.rawType === 'lead') {
      router.push('/(app)/leads');
    }
  };

  const handleTestPush = () => {
    if (!userId || isTestingPush) return;

    void (async () => {
      setIsTestingPush(true);
      try {
        await syncPushTokenForUser(userId);
        const result = await sendTestPushNotification({
          title: 'FCM Test',
          body: 'If you see this, push notifications are working.',
        });

        if (result.sent > 0) {
          await dialog.alert(
            'Push sent',
            `${result.message}\nFCM: ${result.fcm} · Expo: ${result.expo}`,
          );
          return;
        }

        await dialog.alert('Push not delivered', result.message);
      } catch (err) {
        await dialog.alert('Push test failed', handleApiError(err));
      } finally {
        setIsTestingPush(false);
      }
    })();
  };

  const closeOtherSwipeables = (openId: string) => {
    swipeableRefs.current.forEach((ref, id) => {
      if (id !== openId) {
        ref?.close();
      }
    });
  };

  const renderNotificationItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationRow
        item={item}
        body={body}
        label={label}
        micro={micro}
        onPress={() => handleNotificationPress(item)}
        onDelete={() => handleDeleteNotification(item)}
        onSwipeOpen={() => closeOtherSwipeables(item.id)}
        swipeableRef={(ref) => {
          if (ref) {
            swipeableRefs.current.set(item.id, ref);
          } else {
            swipeableRefs.current.delete(item.id);
          }
        }}
      />
    ),
    [body, label, micro, handleDeleteNotification],
  );

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <View className="flex-row items-center px-4" style={{ flexGrow: 0 }}>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED }}
        >
          <Ionicons name="chevron-back" size={width * 0.06} color={colors.NAVY} />
        </Pressable>
        <Text
          className="flex-1 text-center font-bold"
          style={{ fontSize: h2, color: colors.NAVY }}
        >
          Notifications
        </Text>
        <Pressable
          onPress={handleTestPush}
          disabled={isTestingPush}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.SURFACE_MUTED, opacity: isTestingPush ? 0.6 : 1 }}
          accessibilityRole="button"
          accessibilityLabel="Send test push notification"
        >
          <Ionicons
            name={isTestingPush ? 'hourglass-outline' : 'notifications-outline'}
            size={width * 0.05}
            color={colors.NAVY}
          />
        </Pressable>
      </View>

      <View style={{ flexGrow: 0, marginTop: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          {FILTER_PILLS.map((pill) => {
            const isActive = pill === activeFilter;
            return (
              <Pressable
                key={pill}
                onPress={() => setActiveFilter(pill)}
                style={{
                  backgroundColor: isActive ? colors.NAVY : colors.WHITE,
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.BORDER,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: label,
                    color: isActive ? colors.WHITE : colors.BODY_TEXT,
                    fontWeight: isActive ? '600' : '400',
                  }}
                >
                  {pill}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View
        className="flex-row items-center justify-between px-4"
        style={{ flexGrow: 0, marginTop: 12, marginBottom: 8 }}
      >
        <Text style={{ fontSize: label, color: colors.BODY_TEXT }}>
          {filteredNotifications.length} notification
          {filteredNotifications.length === 1 ? '' : 's'}
          {data?.unreadCount ? ` · ${data.unreadCount} unread` : ''}
        </Text>
        <Pressable onPress={handleMarkAllRead} hitSlop={8}>
          <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
            Mark all as read
          </Text>
        </Pressable>
      </View>

      {isPending && !data ? (
        <LoadingScreen message="Loading notifications…" />
      ) : isError && !data ? (
        <ErrorScreen
          message={handleApiError(error)}
          onRetry={() => void refetch()}
        />
      ) : (
      <View style={{ flex: 1 }}>
        <FlashList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="notifications-off-outline" size={48} color={colors.BODY_TEXT} />
              <Text className="mt-3" style={{ fontSize: body, color: colors.BODY_TEXT }}>
                No notifications here
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isNotificationsRefreshing}
              onRefresh={onNotificationsRefresh}
              tintColor={colors.NAVY}
            />
          }
        />
      </View>
      )}
    </View>
  );
}
