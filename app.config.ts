import type { ExpoConfig } from 'expo/config';

/**
 * Expo dynamic config — CommonJS 호환 export (`export =`)로 모듈 형식 충돌 방지.
 * @see https://docs.expo.dev/workflow/configuration/
 */
const expoConfig: ExpoConfig = {
  name: 'KON',
  // EAS projectId(a9b6166d-…)는 Expo에 "ems-connect" slug로 등록됨 — slug 불일치 시 eas build 실패
  slug: 'ems-connect',
  owner: 'techlavalava',
  scheme: 'ems-connect',
  version: '1.0.0',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/a9b6166d-0e75-49b8-9438-f7e1ae573e72',
  },
  orientation: 'portrait',
  icon: './assets/ic_launcher.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/ic_launcher.png',
    resizeMode: 'contain',
    backgroundColor: '#121212',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.anonymous.kon',
    infoPlist: {
      LSApplicationQueriesSchemes: ['kakaoMap', 'kakaomap', 'kakaonavi-sdk', 'kakaonavi', 'tmap'],
    },
  },
  android: {
    package: 'com.anonymous.kon',
    adaptiveIcon: {
      backgroundColor: '#121212',
      foregroundImage: './assets/ic_launcher.png',
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
    './plugins/withGoogleMapsApiKey.js',
    // DISABLED: 비상연락망 & 응급카드 (ICE) — 잠금화면 오버레이
    // './plugins/withLockScreenEmergencyActivity.js',
    'expo-screen-orientation',
    'expo-web-browser',
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
    [
      'expo-notifications',
      {
        icon: './assets/ic_launcher.png',
        color: '#2563eb',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'a9b6166d-0e75-49b8-9438-f7e1ae573e72',
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    portalApiKey: process.env.EXPO_PUBLIC_PORTAL_API_KEY,
    kemixWebUrl: process.env.EXPO_PUBLIC_KEMIX_WEB_URL,
    kakaoJsKey: process.env.EXPO_PUBLIC_KAKAO_JS_KEY,
  },
};

module.exports = expoConfig;
