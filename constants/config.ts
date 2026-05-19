export const config = {
  appName: 'Jewellars Partner',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.jewellars.com',
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as 'development' | 'production',
  isDev: process.env.EXPO_PUBLIC_APP_ENV !== 'production',
} as const;
