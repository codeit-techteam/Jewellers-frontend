import { useRequireOnboardingComplete } from '@hooks/useRequireOnboardingComplete';
import { useLeadsQuery } from '@hooks/useLeadsQuery';
import { colors } from '@constants/colors';
import { countUpcomingLeads, useLeadsStore } from '@store/useLeadsStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  useRequireOnboardingComplete();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const iconSize = width * 0.055;

  useLeadsQuery();

  const storeLeads = useLeadsStore((s) => s.leads);
  const upcomingCount = countUpcomingLeads(storeLeads);

  // Reserve enough room for tab icons + labels + device home indicator / gesture bar
  const TAB_CONTENT_HEIGHT = 56;
  const tabBarHeight = TAB_CONTENT_HEIGHT + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.NAVY,
        tabBarInactiveTintColor: colors.BODY_TEXT,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.WHITE,
          borderTopWidth: 0.5,
          borderTopColor: colors.BORDER,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          elevation: 8,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent the default tab-press from restoring a stale navigation
            // state (e.g. the Add Product screen left in the stack from a
            // previous session). We handle navigation ourselves below.
            e.preventDefault();
            navigation.navigate('inventory', { screen: 'index' });
          },
        })}
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'diamond' : 'diamond-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarBadge: upcomingCount > 0 ? upcomingCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="my-live-store" options={{ href: null }} />
      <Tabs.Screen name="storefront" options={{ href: null }} />
      <Tabs.Screen name="sales-report" options={{ href: null }} />
      <Tabs.Screen name="business-documents" options={{ href: null }} />
      <Tabs.Screen name="business-profile" options={{ href: null }} />
      <Tabs.Screen name="all-products" options={{ href: null }} />
      <Tabs.Screen name="product-detail" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
