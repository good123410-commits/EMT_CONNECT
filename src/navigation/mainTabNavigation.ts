import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import { navigationRef } from '@/navigation/navigationRef';

export function navigateToMainTab<T extends keyof MainTabParamList>(
  screen: T,
  params?: MainTabParamList[T],
): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Main', { screen, params } as never);
}

/** 약물정보찾기 — 루트 스택 (하단 탭 밖) */
export function navigateToChemicalScreen(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Chemical');
}
