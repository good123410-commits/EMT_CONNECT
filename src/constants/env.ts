import Constants from 'expo-constants';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  Constants.expoConfig?.extra?.supabaseUrl ??
  'https://cdkyoeskhrwrpxgbmpqu.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  'sb_publishable_2QyLq5Vz-bkp0gMhpPjo9w_wvgIEzMV';

export const PORTAL_API_KEY =
  process.env.EXPO_PUBLIC_PORTAL_API_KEY ?? Constants.expoConfig?.extra?.portalApiKey ?? '';

/** KEMIX 웹 자료실 URL (공유 링크용, 선택) */
export const KEMIX_WEB_URL =
  process.env.EXPO_PUBLIC_KEMIX_WEB_URL ??
  Constants.expoConfig?.extra?.kemixWebUrl ??
  '';
