import { DarkTheme } from '@react-navigation/native';
import { APP_COLORS } from '@/constants/appTheme';
import { APP_NAV_HEADER_COLORS } from '@/constants/navigationHeader';

export const kemixNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: APP_COLORS.blue,
    background: APP_COLORS.background,
    card: APP_COLORS.surface,
    text: APP_COLORS.textPrimary,
    border: APP_COLORS.border,
    notification: APP_COLORS.blue,
  },
  dark: true,
};

/** @deprecated kemixNavigationTheme 사용 */
export const defaultHeaderScreenOptions = {
  headerStyle: { backgroundColor: APP_NAV_HEADER_COLORS.background },
  headerTintColor: APP_NAV_HEADER_COLORS.icon,
  headerTitleStyle: {
    color: APP_NAV_HEADER_COLORS.title,
    fontFamily: 'Pretendard-SemiBold',
  },
  headerShadowVisible: false,
} as const;
