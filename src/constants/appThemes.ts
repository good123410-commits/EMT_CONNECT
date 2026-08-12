/** 앱 전역 테마 팔레트 — light / dark / beige */

export type AppThemeMode = 'light' | 'dark' | 'beige';

export type AppColorPalette = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  blue: string;
  blueSoft: string;
  blueMuted: string;
  blueLight: string;
  navy: string;
  navySoft: string;
  tabActive: string;
  tabInactive: string;
  accent: string;
  overlay: string;
  /** 본문·카드 텍스트 — 다크 배경 가독성 보강 */
  bodyText: string;
  metaText: string;
  categoryAccent: string;
};

export const APP_THEME_STORAGE_KEY = 'ems_connect_app_theme_v1';

export const APP_THEME_LABELS: Record<AppThemeMode, string> = {
  light: '라이트',
  dark: '다크',
  beige: '베이지',
};

export const APP_THEME_DESCRIPTIONS: Record<AppThemeMode, string> = {
  light: '밝은 흰색 배경 · 선명한 검은/진회색 텍스트',
  dark: '어두운 배경 · 밝은 흰색/연회색 텍스트',
  beige: '따뜻한 베이지 배경 · 딥 브라운/차콜 텍스트',
};

const DARK_THEME: AppColorPalette = {
  background: '#121212',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  border: '#2E2E2E',
  borderLight: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  blue: '#3B82F6',
  blueSoft: '#60A5FA',
  blueMuted: '#1E3A5F',
  blueLight: '#1A2332',
  navy: '#FFFFFF',
  navySoft: '#D1D5DB',
  tabActive: '#3B82F6',
  tabInactive: '#9CA3AF',
  accent: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.55)',
  bodyText: '#F3F4F6',
  metaText: '#CBD5E1',
  categoryAccent: '#5EEAD4',
};

const LIGHT_THEME: AppColorPalette = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  blue: '#2563EB',
  blueSoft: '#3B82F6',
  blueMuted: '#DBEAFE',
  blueLight: '#EFF6FF',
  navy: '#0F172A',
  navySoft: '#475569',
  tabActive: '#2563EB',
  tabInactive: '#94A3B8',
  accent: '#2563EB',
  overlay: 'rgba(15, 23, 42, 0.45)',
  bodyText: '#1E293B',
  metaText: '#64748B',
  categoryAccent: '#0D9488',
};

const BEIGE_THEME: AppColorPalette = {
  background: '#F5F0E8',
  surface: '#FAF7F2',
  surfaceElevated: '#EDE8DF',
  border: '#DDD5C8',
  borderLight: '#E8E0D4',
  textPrimary: '#3D2E1F',
  textSecondary: '#5C4A3A',
  textMuted: '#7A6B5D',
  blue: '#2563EB',
  blueSoft: '#3B82F6',
  blueMuted: '#D4E4F7',
  blueLight: '#E8F0FA',
  navy: '#3D2E1F',
  navySoft: '#5C4A3A',
  tabActive: '#2563EB',
  tabInactive: '#9A8B7A',
  accent: '#2563EB',
  overlay: 'rgba(61, 46, 31, 0.4)',
  bodyText: '#2F2418',
  metaText: '#6B5A48',
  categoryAccent: '#0F766E',
};

export const APP_THEME_PALETTES: Record<AppThemeMode, AppColorPalette> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  beige: BEIGE_THEME,
};

export function getAppThemePalette(mode: AppThemeMode): AppColorPalette {
  return APP_THEME_PALETTES[mode];
}

export function isValidAppThemeMode(value: string | null | undefined): value is AppThemeMode {
  return value === 'light' || value === 'dark' || value === 'beige';
}
