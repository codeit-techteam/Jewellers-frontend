import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { colors } from '@constants/colors';
import {
  getNotifications,
  markAllRead,
  markRead,
} from '@services/notificationsService';
import type { AppNotification } from '@/types/notifications';
import { handleApiError } from '@utils/handleApiError';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { dialog } from '@utils/dialog';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NotificationFilter = 'All' | 'Orders' | 'Leads' | 'System';

const FILTER_PILLS: NotificationFilter[] = ['All', 'Orders', 'Leads', 'System'];

function filterTypeForPill(pill: NotificationFilter): string | undefined {
  if (pill === 'Orders') return 'order';
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

function NotificationRow({
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
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
          className="mb-2 items-center justify-center rounded-xl"
          style={{
            width: 88,
            marginLeft: 8,
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
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('All');
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  const apiType = filterTypeForPill(activeFilter);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['notifications', activeFilter],
    queryFn: () => getNotifications(apiType),
  });

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

  const deleteNotification = (id: string) => {
    swipeableRefs.current.get(id)?.close();
    swipeableRefs.current.delete(id);
  };

  const closeOtherSwipeables = (openId: string) => {
    swipeableRefs.current.forEach((ref, id) => {
      if (id !== openId) {
        ref?.close();
      }
    });
  };

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
          style={{ fontSize: h2, color: colors.NAVY, marginRight: width * 0.1 }}
        >
          Notifications
        </Text>
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="notifications-off-outline" size={48} color={colors.BODY_TEXT} />
            <Text className="mt-3" style={{ fontSize: body, color: colors.BODY_TEXT }}>
              No notifications here
            </Text>
          </View>
        ) : (
          filteredNotifications.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              body={body}
              label={label}
              micro={micro}
              onPress={() => handleToggleRead(item.id)}
              onDelete={() => deleteNotification(item.id)}
              onSwipeOpen={() => closeOtherSwipeables(item.id)}
              swipeableRef={(ref) => {
                if (ref) {
                  swipeableRefs.current.set(item.id, ref);
                } else {
                  swipeableRefs.current.delete(item.id);
                }
              }}
            />
          ))
        )}
      </ScrollView>
      )}
    </View>
  );
}
