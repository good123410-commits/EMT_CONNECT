/**
 * 앱 전역 디자인 시스템 — 테마 팔레트·시맨틱 토큰·헬퍼
 */
export {
  APP_THEME_DESCRIPTIONS,
  APP_THEME_LABELS,
  APP_THEME_PALETTES,
  APP_THEME_STORAGE_KEY,
  getAppThemePalette,
  isValidAppThemeMode,
  type AppColorPalette,
  type AppThemeMode,
} from '@/constants/appThemes';

import type { AppColorPalette } from '@/constants/appThemes';

/** 시맨틱 토큰 — UI 용어와 1:1 매핑 */
export type AppSemanticColors = {
  background: string;
  cardBackground: string;
  surfaceElevated: string;
  text: string;
  subText: string;
  mutedText: string;
  border: string;
  borderLight: string;
  accent: string;
  bodyText: string;
  metaText: string;
};

export function toSemanticColors(palette: AppColorPalette): AppSemanticColors {
  return {
    background: palette.background,
    cardBackground: palette.surface,
    surfaceElevated: palette.surfaceElevated,
    text: palette.textPrimary,
    subText: palette.textSecondary,
    mutedText: palette.textMuted,
    border: palette.border,
    borderLight: palette.borderLight,
    accent: palette.accent,
    bodyText: palette.bodyText,
    metaText: palette.metaText,
  };
}

export type AppNavHeaderColors = {
  background: string;
  border: string;
  title: string;
  subtitle: string;
  icon: string;
  iconMuted: string;
  brand: string;
  brandText: string;
  pressed: string;
};

export function getNavHeaderColors(palette: AppColorPalette): AppNavHeaderColors {
  return {
    background: palette.surface,
    border: palette.border,
    title: palette.textPrimary,
    subtitle: palette.textSecondary,
    icon: palette.textPrimary,
    iconMuted: palette.textMuted,
    brand: '#DC2626',
    brandText: palette.textPrimary,
    pressed:
      palette.background === '#121212'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.06)',
  };
}

export function createAppTypography(palette: AppColorPalette) {
  return {
    display: {
      fontFamily: 'Pretendard-Bold',
      fontSize: 28,
      lineHeight: 36,
      color: palette.textPrimary,
    },
    title: {
      fontFamily: 'Pretendard-Bold',
      fontSize: 22,
      lineHeight: 30,
      color: palette.textPrimary,
    },
    headline: {
      fontFamily: 'Pretendard-SemiBold',
      fontSize: 18,
      lineHeight: 26,
      color: palette.textPrimary,
    },
    body: {
      fontFamily: 'Pretendard',
      fontSize: 15,
      lineHeight: 22,
      color: palette.textPrimary,
    },
    bodyMedium: {
      fontFamily: 'Pretendard-Medium',
      fontSize: 15,
      lineHeight: 22,
      color: palette.textPrimary,
    },
    caption: {
      fontFamily: 'Pretendard',
      fontSize: 13,
      lineHeight: 18,
      color: palette.textSecondary,
    },
    label: {
      fontFamily: 'Pretendard-SemiBold',
      fontSize: 12,
      lineHeight: 16,
      color: palette.textSecondary,
    },
  } as const;
}
