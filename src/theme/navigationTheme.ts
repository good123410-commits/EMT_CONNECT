import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { AppColorPalette } from '@/constants/appThemes';

export function createNavigationTheme(colors: AppColorPalette, isDark: boolean): Theme {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.blue,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.blue,
    },
    dark: isDark,
  };
}
