import { DarkTheme } from '@react-navigation/native';
import { APP_COLORS } from '@/constants/appTheme';

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
};
