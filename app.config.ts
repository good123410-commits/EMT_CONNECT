import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'EMS_Connect',
  slug: 'ems-connect',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      'expo-image-picker',
      {
        photosPermission: '자격증 이미지 업로드를 위해 사진 접근 권한이 필요합니다.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          '주변 AED, 응급실, 약국 정보를 제공하기 위해 위치 접근 권한이 필요합니다.',
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    portalApiKey: process.env.EXPO_PUBLIC_PORTAL_API_KEY,
  },
};

export default config;
