import Constants from 'expo-constants';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  Constants.expoConfig?.extra?.supabaseUrl ??
  'https://cdkyoeskhrwrpxgbmpqu.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  'sb_publishable_2QyLq5Vz-bkp0gMhpPjo9w_wvgIEzMV';

const PORTAL_KEY_PLACEHOLDER_PATTERN = /your_.*key|_here$/i;

function readRawPortalApiKey(): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra =
    (typeof extra?.portalApiKey === 'string' ? extra.portalApiKey : '') ||
    (typeof extra?.EXPO_PUBLIC_PORTAL_API_KEY === 'string'
      ? extra.EXPO_PUBLIC_PORTAL_API_KEY
      : '');

  return (
    process.env.EXPO_PUBLIC_PORTAL_API_KEY ??
    fromExtra ??
    ''
  );
}

export function isValidPortalApiKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed || trimmed.length < 8) return false;
  if (PORTAL_KEY_PLACEHOLDER_PATTERN.test(trimmed)) return false;
  return true;
}

/** 공공데이터포털 serviceKey — env / app.config extra에서 로드, 미설정·플레이스홀더는 빈 문자열 */
export function resolvePortalApiKey(): string {
  const raw = readRawPortalApiKey();
  return isValidPortalApiKey(raw) ? raw.trim() : '';
}

export const PORTAL_API_KEY = resolvePortalApiKey();

export function hasPortalApiKey(): boolean {
  return PORTAL_API_KEY.length > 0;
}

/** KEMIX 웹 자료실 URL (공유 링크용, 선택) */
export const KEMIX_WEB_URL =
  process.env.EXPO_PUBLIC_KEMIX_WEB_URL ??
  Constants.expoConfig?.extra?.kemixWebUrl ??
  'https://kemix.kr';
