import { useMemo } from 'react';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { getKemixStatusColors } from '@/theme/kemixSemantic';
import { createAppTypography, toSemanticColors } from '@/theme/theme';

/** 전역 테마 색상·시맨틱 토큰·타이포그래피 */
export function useThemedColors() {
  const { colors, mode, setMode, isDark, statusBarStyle } = useAppTheme();
  const semantic = useMemo(() => toSemanticColors(colors), [colors]);
  const typography = useMemo(() => createAppTypography(colors), [colors]);
  const status = useMemo(() => getKemixStatusColors(colors, mode), [colors, mode]);

  return {
    colors,
    semantic,
    status,
    typography,
    mode,
    setMode,
    isDark,
    statusBarStyle,
  };
}
