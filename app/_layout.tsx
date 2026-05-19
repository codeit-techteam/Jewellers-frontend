import '../global.css';

import { AuthBootstrap } from '@components/auth/AuthBootstrap';
import { QueryProvider } from '@providers/QueryProvider';
import { useAppStore } from '@store/useAppStore';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const themeMode = useAppStore((state) => state.themeMode);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthBootstrap />
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
