import Constants from 'expo-constants';

/** 카카오 JavaScript / Navi SDK 앱 키 — env 우선, 미설정 시 기본값 */
export const KAKAO_JS_KEY =
  process.env.EXPO_PUBLIC_KAKAO_JS_KEY?.trim() ||
  (typeof Constants.expoConfig?.extra?.kakaoJsKey === 'string'
    ? Constants.expoConfig.extra.kakaoJsKey.trim()
    : '') ||
  '5b1196fad925c9e496d0fb6f9d416318';
