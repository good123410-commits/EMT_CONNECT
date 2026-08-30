import Constants from 'expo-constants';

/** 프로덕션 Supabase — Expo Go/실기기는 반드시 공인 HTTPS URL 사용 (localhost 불가) */
export const DEFAULT_SUPABASE_URL = 'https://cdkyoeskhrwrpxgbmpqu.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_2QyLq5Vz-bkp0gMhpPjo9w_wvgIEzMV';

const LOCAL_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/i;

const PORTAL_KEY_PLACEHOLDER_PATTERN = /your_.*key|_here$/i;

type ExtraBag = Record<string, unknown> | undefined;

function readExtraString(...keys: string[]): string {
  const bags: ExtraBag[] = [
    Constants.expoConfig?.extra as Record<string, unknown> | undefined,
    (Constants as { manifest2?: { extra?: ExtraBag } }).manifest2?.extra,
    (Constants as { manifest?: { extra?: ExtraBag } }).manifest?.extra,
  ];

  for (const bag of bags) {
    if (!bag) continue;
    for (const key of keys) {
      const value = bag[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return '';
}

function pickNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function isLocalOrPrivateHost(hostname: string): boolean {
  return LOCAL_HOST_PATTERN.test(hostname.trim());
}

/** Expo Go·실기기에서 사용할 Supabase URL 정규화 (localhost/사설 IP 거부) */
export function normalizeSupabasePublicUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    if (isLocalOrPrivateHost(url.hostname)) return '';
    return url.origin.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function resolveSupabaseUrl(): string {
  const candidates = [
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    readExtraString('supabaseUrl', 'EXPO_PUBLIC_SUPABASE_URL'),
    DEFAULT_SUPABASE_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeSupabasePublicUrl(candidate ?? '');
    if (normalized) return normalized;
  }

  return DEFAULT_SUPABASE_URL;
}

function resolveSupabaseAnonKey(): string {
  return pickNonEmpty(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    readExtraString('supabaseAnonKey', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    DEFAULT_SUPABASE_ANON_KEY,
  );
}

export const SUPABASE_URL = resolveSupabaseUrl();
export const SUPABASE_ANON_KEY = resolveSupabaseAnonKey();

export type SupabaseEnvDiagnostics = {
  url: string;
  anonKeyConfigured: boolean;
  anonKeyLength: number;
  source: 'env' | 'extra' | 'default';
  rejectedLocalhost: boolean;
};

export function getSupabaseEnvDiagnostics(): SupabaseEnvDiagnostics {
  const rawEnvUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const rawExtraUrl = readExtraString('supabaseUrl', 'EXPO_PUBLIC_SUPABASE_URL');
  const rejectedLocalhost =
    Boolean(rawEnvUrl && !normalizeSupabasePublicUrl(rawEnvUrl)) ||
    Boolean(rawExtraUrl && !normalizeSupabasePublicUrl(rawExtraUrl));

  let source: SupabaseEnvDiagnostics['source'] = 'default';
  if (normalizeSupabasePublicUrl(rawEnvUrl)) {
    source = 'env';
  } else if (normalizeSupabasePublicUrl(rawExtraUrl)) {
    source = 'extra';
  }

  return {
    url: SUPABASE_URL,
    anonKeyConfigured: SUPABASE_ANON_KEY.length > 20,
    anonKeyLength: SUPABASE_ANON_KEY.length,
    source,
    rejectedLocalhost,
  };
}

function readRawPortalApiKey(): string {
  return pickNonEmpty(
    process.env.EXPO_PUBLIC_PORTAL_API_KEY,
    readExtraString('portalApiKey', 'EXPO_PUBLIC_PORTAL_API_KEY'),
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
  pickNonEmpty(
    process.env.EXPO_PUBLIC_KEMIX_WEB_URL,
    readExtraString('kemixWebUrl', 'EXPO_PUBLIC_KEMIX_WEB_URL'),
  ) || 'https://kemix.kr';
