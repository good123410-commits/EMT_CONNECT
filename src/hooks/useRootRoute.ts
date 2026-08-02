import { useEffect, useState } from 'react';
import { getCurrentRootRoute } from '@/navigation/rootNavigation';
import { navigationRef } from '@/navigation/navigationRef';
import type { RootStackParamList } from '@/navigation/types';

type RootRoute = keyof RootStackParamList;

export function useRootRoute(): RootRoute | undefined {
  const [route, setRoute] = useState<RootRoute | undefined>(() =>
    navigationRef.isReady() ? getCurrentRootRoute() : undefined,
  );

  useEffect(() => {
    const sync = () => setRoute(getCurrentRootRoute());

    if (navigationRef.isReady()) {
      sync();
    }

    const unsubscribe = navigationRef.addListener('state', sync);
    return unsubscribe;
  }, []);

  return route;
}

/** 로딩·인증 화면에서는 FAB 숨김 */
export function useShowGlobalMoreFab(): boolean {
  const route = useRootRoute();
  return (
    route === 'Main' ||
    route === 'Expert' ||
    route === 'Utilities' ||
    route === 'Chemical' ||
    route === 'AdminDashboard'
  );
}

/** 글로벌 상단 헤더 노출 여부 */
export function useShowAppNavigationHeader(): boolean {
  const route = useRootRoute();
  return (
    route === 'Main' || route === 'Utilities' || route === 'Chemical' || route === 'AdminDashboard'
  );
}
