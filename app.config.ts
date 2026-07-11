import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const base = appJson.expo as ExpoConfig;

export default (): ExpoConfig => ({
  ...base,
  android: {
    ...base.android,
    // EAS file env var (preview/production); local fallback for dev builds.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
