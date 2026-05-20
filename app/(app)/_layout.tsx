import { useRequireOnboardingComplete } from '@hooks/useRequireOnboardingComplete';
import { colors } from '@constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';

export default function AppLayout() {
  useRequireOnboardingComplete();
  const { width } = useWindowDimensions();
  const iconSize = width * 0.055;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.NAVY,
        tabBarInactiveTintColor: colors.BODY_TEXT,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.WHITE,
          borderTopWidth: 1,
          borderTopColor: colors.BORDER,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
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
