import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { vars } from 'nativewind';
import {
  APP_THEME_PALETTES,
  APP_THEME_STORAGE_KEY,
  getAppThemePalette,
  isValidAppThemeMode,
  type AppColorPalette,
  type AppThemeMode,
} from '@/constants/appThemes';
import { createAppTypography, getNavHeaderColors, toSemanticColors } from '@/theme/theme';

type AppThemeContextValue = {
  mode: AppThemeMode;
  colors: AppColorPalette;
  semantic: ReturnType<typeof toSemanticColors>;
  typography: ReturnType<typeof createAppTypography>;
  navHeader: ReturnType<typeof getNavHeaderColors>;
  themeVars: ReturnType<typeof vars>;
  setMode: (mode: AppThemeMode) => void;
  isDark: boolean;
  statusBarStyle: 'light' | 'dark';
  loading: boolean;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function paletteToCssVars(colors: AppColorPalette) {
  return {
    '--color-kemix-bg': colors.background,
    '--color-kemix-surface': colors.surface,
    '--color-kemix-elevated': colors.surfaceElevated,
    '--color-kemix-border': colors.border,
    '--color-kemix-border-light': colors.borderLight,
    '--color-kemix-text': colors.textPrimary,
    '--color-kemix-text-secondary': colors.textSecondary,
    '--color-kemix-muted': colors.textMuted,
    '--color-kemix-blue': colors.blue,
    '--color-kemix-blue-soft': colors.blueSoft,
    '--color-kemix-blue-muted': colors.blueMuted,
    '--color-kemix-blue-light': colors.blueLight,
    '--color-kemix-navy': colors.navy,
    '--color-kemix-navy-soft': colors.navySoft,
  } as const;
}

function applyWebThemeVars(colors: AppColorPalette) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  const entries = paletteToCssVars(colors);
  Object.entries(entries).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.style.backgroundColor = colors.background;
  root.style.color = colors.textPrimary;
  if (document.body) {
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.textPrimary;
  }
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppThemeMode>('dark');
  const [loading, setLoading] = useState(true);

  const colors = useMemo(() => getAppThemePalette(mode), [mode]);
  const semantic = useMemo(() => toSemanticColors(colors), [colors]);
  const typography = useMemo(() => createAppTypography(colors), [colors]);
  const navHeader = useMemo(() => getNavHeaderColors(colors), [colors]);
  const themeVars = useMemo(() => vars(paletteToCssVars(colors)), [colors]);
  const isDark = mode === 'dark';
  const statusBarStyle: 'light' | 'dark' = mode === 'light' || mode === 'beige' ? 'dark' : 'light';

  useEffect(() => {
    void AsyncStorage.getItem(APP_THEME_STORAGE_KEY).then((saved) => {
      if (isValidAppThemeMode(saved)) {
        setModeState(saved);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    applyWebThemeVars(colors);
  }, [colors]);

  const setMode = useCallback((next: AppThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(APP_THEME_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors,
      semantic,
      typography,
      navHeader,
      themeVars,
      setMode,
      isDark,
      statusBarStyle,
      loading,
    }),
    [mode, colors, semantic, typography, navHeader, themeVars, setMode, isDark, statusBarStyle, loading],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return ctx;
}

export function useAppThemeOptional(): AppThemeContextValue | null {
  return useContext(AppThemeContext);
}

/** 레거시 정적 import 호환 — 다크 팔레트 */
export { APP_THEME_PALETTES };
