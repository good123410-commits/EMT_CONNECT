import type { NavigationState, PartialState } from '@react-navigation/native';
import {
  CHEMICAL_SCREEN_TITLE,
  MAIN_TAB_TITLES,
  SETTINGS_NESTED_TITLES,
  UTILITY_SCREEN_TITLES,
} from '@/constants/navigationHeader';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import type { UtilitiesStackParamList } from '@/navigation/UtilitiesStackNavigator';
import { navigationRef } from '@/navigation/navigationRef';
import type { RootStackParamList } from '@/navigation/types';

type NavState = NavigationState | PartialState<NavigationState>;

export type AppNavigationHeaderMeta = {
  rootRoute: keyof RootStackParamList | undefined;
  title: string;
  canGoBack: boolean;
};

function getActiveRoute(state: NavState | undefined): { name: string; state?: NavState } | undefined {
  if (!state || !('routes' in state) || state.routes.length === 0) return undefined;
  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];
  if (!route) return undefined;
  if (route.state) {
    return getActiveRoute(route.state as NavState) ?? route;
  }
  return route;
}

function getMainTabTitle(state: NavState | undefined): string {
  if (!state || !('routes' in state)) return MAIN_TAB_TITLES.Home;
  const mainRoute = state.routes.find((r) => r.name === 'Main');
  const tabState = mainRoute?.state as NavState | undefined;
  if (!tabState || !('routes' in tabState)) return MAIN_TAB_TITLES.Home;

  const tabIndex = tabState.index ?? 0;
  const tabRoute = tabState.routes[tabIndex];
  if (!tabRoute) return MAIN_TAB_TITLES.Home;

  const tabName = tabRoute.name as keyof MainTabParamList;
  return MAIN_TAB_TITLES[tabName] ?? APP_HEADER_FALLBACK_TITLE;
}


const APP_HEADER_FALLBACK_TITLE = 'KON';

export function resolveNavigationHeaderMeta(
  overrideTitle?: string,
): AppNavigationHeaderMeta {
  if (!navigationRef.isReady()) {
    return { rootRoute: undefined, title: overrideTitle ?? APP_HEADER_FALLBACK_TITLE, canGoBack: false };
  }

  const state = navigationRef.getRootState();
  const rootIndex = state.index ?? 0;
  const rootRoute = state.routes[rootIndex]?.name as keyof RootStackParamList | undefined;

  if (rootRoute === 'Chemical') {
    return {
      rootRoute,
      title: overrideTitle ?? CHEMICAL_SCREEN_TITLE,
      canGoBack: navigationRef.canGoBack(),
    };
  }

  if (rootRoute === 'Utilities') {
    const active = getActiveRoute(state);
    const utilityRoute = active?.name as keyof UtilitiesStackParamList | undefined;
    const title =
      overrideTitle ??
      (utilityRoute ? UTILITY_SCREEN_TITLES[utilityRoute] : '응급 유틸');
    return {
      rootRoute,
      title,
      canGoBack: true,
    };
  }

  if (rootRoute === 'AdminDashboard') {
    return {
      rootRoute,
      title: overrideTitle ?? SETTINGS_NESTED_TITLES.AdminDashboard,
      canGoBack: navigationRef.canGoBack(),
    };
  }

  if (rootRoute === 'Main') {
    return {
      rootRoute,
      title: overrideTitle ?? getMainTabTitle(state),
      canGoBack: false,
    };
  }

  return {
    rootRoute,
    title: overrideTitle ?? APP_HEADER_FALLBACK_TITLE,
    canGoBack: false,
  };
}
