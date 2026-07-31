import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import { navigationRef } from '@/navigation/navigationRef';

export function navigateToMainTab<T extends keyof MainTabParamList>(
  screen: T,
  params?: MainTabParamList[T],
): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Main', { screen, params } as never);
}
