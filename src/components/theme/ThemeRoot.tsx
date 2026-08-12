import { View, type ViewProps } from 'react-native';
import { useAppTheme } from '@/contexts/AppThemeContext';

type ThemeRootProps = ViewProps & {
  children: React.ReactNode;
};

/** NativeWind CSS 변수 + 배경색을 테마에 맞게 적용하는 루트 래퍼 */
export function ThemeRoot({ children, style, ...rest }: ThemeRootProps) {
  const { colors, themeVars } = useAppTheme();

  return (
    <View
      {...rest}
      style={[themeVars, { flex: 1, backgroundColor: colors.background }, style]}
      className="bg-kemix-bg"
    >
      {children}
    </View>
  );
}
