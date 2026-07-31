import { APP_COLORS } from '@/constants/appTheme';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';

/** 메인 하단 탭 — 딥 네이비 포인트, 안정적인 화이트 바 */
export function useMainTabBarConfig() {
  return useExpertTabBarConfig({
    activeTintColor: APP_COLORS.tabActive,
    inactiveTintColor: APP_COLORS.tabInactive,
    backgroundColor: APP_COLORS.surface,
    borderTopColor: APP_COLORS.border,
    labelFontSize: 11,
  });
}
