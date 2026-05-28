import Constants from 'expo-constants';

/**
 * Resolves the backend API base URL.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL env var (explicit override — use for prod / staging)
 *  2. Dev auto-detect: derive the host from Expo's Metro bundler URI so the
 *     app reaches the local backend whether running on an emulator or a
 *     physical device connected to the same Wi-Fi network.
 *  3. Fall-through production URL.
 *
 * Backend routes are mounted at /api/jeweller/* so that prefix is included.
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  if (__DEV__) {
    // hostUri is "192.168.x.x:8081" (or "localhost:8081" on emulator)
    const hostUri =
      Constants.expoConfig?.hostUri ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Constants.manifest as any)?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:5001/api/jeweller`;
    }
  }

  return 'https://api.jewellars.com/api/jeweller';
}

export const config = {
  appName: 'Jewellars Partner',
  apiUrl: resolveApiUrl(),
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as 'development' | 'production',
  isDev: process.env.EXPO_PUBLIC_APP_ENV !== 'production',
} as const;
