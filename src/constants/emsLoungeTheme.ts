/** EMS 커뮤니티(히든 라운지) — 앱 전역 테마와 연동 */

import { useMemo } from 'react';
import type { AppColorPalette } from '@/constants/appThemes';
import { useThemedColors } from '@/hooks/useThemedColors';

export type EmsLoungePalette = {
  navy: string;
  text: string;
  navyMid: string;
  accent: string;
  accentSoft: string;
  accentMuted: string;
  green: string;
  greenSoft: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  error: string;
  errorBg: string;
  amberBg: string;
  amberText: string;
};

/** @deprecated use useEmsLoungeTheme() — 레거시 정적 다크 팔레트 */
export const EMS_LOUNGE: EmsLoungePalette = {
  navy: '#FFFFFF',
  text: '#FFFFFF',
  navyMid: '#242424',
  accent: '#3B82F6',
  accentSoft: '#60A5FA',
  accentMuted: '#1A2332',
  green: '#34D399',
  greenSoft: '#1A2E28',
  background: '#121212',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',
  border: '#2E2E2E',
  borderLight: '#333333',
  error: '#F87171',
  errorBg: '#2A1A1A',
  amberBg: '#2A2218',
  amberText: '#FBBF24',
};

export function mapAppPaletteToEmsLounge(colors: AppColorPalette, isDark: boolean): EmsLoungePalette {
  return {
    navy: colors.navy,
    text: colors.textPrimary,
    navyMid: colors.surfaceElevated,
    accent: colors.blue,
    accentSoft: colors.blueSoft,
    accentMuted: colors.blueMuted,
    green: '#34D399',
    greenSoft: isDark ? '#1A2E28' : '#D1FAE5',
    background: colors.background,
    surface: colors.surface,
    surfaceElevated: colors.surfaceElevated,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
    border: colors.border,
    borderLight: colors.borderLight,
    error: '#F87171',
    errorBg: isDark ? '#2A1A1A' : '#FEF2F2',
    amberBg: isDark ? '#2A2218' : '#FEF3C7',
    amberText: '#FBBF24',
  };
}

export function useEmsLoungeTheme() {
  const { colors, isDark } = useThemedColors();

  return useMemo(() => {
    const lounge = mapAppPaletteToEmsLounge(colors, isDark);
    const chip = {
      activeBg: lounge.accent,
      activeText: '#FFFFFF',
      inactiveBg: lounge.surfaceElevated,
      inactiveText: lounge.textSecondary,
      inactiveBorder: lounge.border,
      radius: 999,
      paddingHorizontal: 16,
      paddingVertical: 9,
    };
    return { lounge, chip };
  }, [colors, isDark]);
}

export const EMS_LOUNGE_SHADOW = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSoft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const EMS_LOUNGE_SPACING = {
  screen: 32,
  cardGap: 20,
  screenTop: 8,
  cardPadding: 24,
  headerBottom: 12,
} as const;

/** @deprecated use useEmsLoungeTheme().chip */
export const EMS_LOUNGE_CHIP = {
  activeBg: EMS_LOUNGE.accent,
  activeText: '#FFFFFF',
  inactiveBg: EMS_LOUNGE.surfaceElevated,
  inactiveText: EMS_LOUNGE.textSecondary,
  inactiveBorder: EMS_LOUNGE.border,
  radius: 999,
  paddingHorizontal: 16,
  paddingVertical: 9,
} as const;
