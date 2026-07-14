import type { RootStackParamList } from '@/navigation/types';
import { navigationRef } from '@/navigation/navigationRef';

type RootRoute = keyof RootStackParamList;

export function getCurrentRootRoute(): RootRoute | undefined {
  if (!navigationRef.isReady()) return undefined;
  const state = navigationRef.getRootState();
  const route = state.routes[state.index];
  return route?.name as RootRoute | undefined;
}

/**
 * auth bootstrap / 로그아웃 등 — 스택을 새로 시작해야 할 때만 reset.
 */
export function resetRootRoute(name: RootRoute): void {
  if (!navigationRef.isReady()) return;
  navigationRef.reset({ index: 0, routes: [{ name }] });
}

/**
 * Main ↔ Expert 전환 시 push/pop으로 히스토리 보존.
 * Loading / Auth / 로그아웃은 reset.
 */
export function applyRootRouteTransition(
  target: RootRoute,
  options: { hasSession: boolean },
): boolean {
  if (!navigationRef.isReady()) return false;

  const current = getCurrentRootRoute();
  if (current === target) return false;

  const { hasSession } = options;

  if (!hasSession || target === 'Loading' || target === 'Auth') {
    resetRootRoute(target);
    return true;
  }

  if (target === 'Expert') {
    if (current === 'Main') {
      navigationRef.navigate('Expert');
    } else if (current !== 'Expert') {
      navigationRef.reset({
        index: 1,
        routes: [{ name: 'Main' }, { name: 'Expert' }],
      });
    }
    return true;
  }

  if (target === 'Main') {
    if (current === 'Expert') {
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
      } else {
        resetRootRoute('Main');
      }
    } else if (current === 'Loading' || current === 'Auth') {
      resetRootRoute('Main');
    } else if (current !== 'Main') {
      resetRootRoute('Main');
    }
    return true;
  }

  resetRootRoute(target);
  return true;
}
