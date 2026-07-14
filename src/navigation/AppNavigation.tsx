import { NavigationContainer } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { navigationRef } from '@/navigation/navigationRef';
import { applyRootRouteTransition, getCurrentRootRoute } from '@/navigation/rootNavigation';
import type { RootStackParamList } from '@/navigation/types';
import type { UserRole } from '@/lib/supabaseClient';
import { isExpertRole } from '@/utils/roleAccess';

type RootRoute = keyof RootStackParamList;

function resolveRoute(
  loading: boolean,
  hasSession: boolean,
  isExpertMode: boolean,
  role: UserRole,
): RootRoute {
  if (loading) return 'Loading';
  if (!hasSession) return 'Auth';
  if (isExpertMode && isExpertRole(role)) return 'Expert';
  return 'Main';
}

/**
 * auth + 전문가 모드 동기화.
 * Main ↔ Expert는 push/pop(navigate/goBack)으로 히스토리 보존, auth 전환만 reset.
 */
export function AppNavigation() {
  const { session, loading } = useAuth();
  const { role, isExpertMode, exitExpertMode } = useUserRole();
  const isContainerReady = useRef(false);
  const prevTarget = useRef<RootRoute | null>(null);
  const RootNavigator = useMemo(
    () => require('@/navigation/RootNavigator').RootNavigator,
    [],
  );

  const applyAuthRoute = useCallback(() => {
    const target = resolveRoute(loading, Boolean(session), isExpertMode, role);
    const current = getCurrentRootRoute();

    if (prevTarget.current === target && current === target) return;
    if (!navigationRef.isReady()) return;

    applyRootRouteTransition(target, { hasSession: Boolean(session) });
    prevTarget.current = target;
  }, [loading, session, isExpertMode, role]);

  const handleContainerReady = useCallback(() => {
    isContainerReady.current = true;
    applyAuthRoute();
  }, [applyAuthRoute]);

  useEffect(() => {
    if (!isContainerReady.current) return;
    applyAuthRoute();
  }, [applyAuthRoute]);

  useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => {
      if (!navigationRef.isReady()) return;
      const current = getCurrentRootRoute();
      if (current === 'Loading') {
        applyRootRouteTransition(Boolean(session) ? 'Main' : 'Auth', {
          hasSession: Boolean(session),
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [loading, session]);

  useEffect(() => {
    if (!session) {
      exitExpertMode();
    }
  }, [session, exitExpertMode]);

  return (
    <NavigationContainer ref={navigationRef} onReady={handleContainerReady}>
      <RootNavigator />
    </NavigationContainer>
  );
}
