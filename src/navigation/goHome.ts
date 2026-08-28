import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '@/navigation/navigationRef';

type HomeRefreshListener = () => void;

const homeRefreshListeners = new Set<HomeRefreshListener>();
let pendingHomeRefresh = false;

export function subscribeHomeScreenRefresh(listener: HomeRefreshListener): () => void {
  homeRefreshListeners.add(listener);
  if (pendingHomeRefresh) {
    pendingHomeRefresh = false;
    listener();
  }
  return () => {
    homeRefreshListeners.delete(listener);
  };
}

export function triggerHomeScreenRefresh(): void {
  pendingHomeRefresh = true;
  if (homeRefreshListeners.size === 0) {
    return;
  }
  pendingHomeRefresh = false;
  homeRefreshListeners.forEach((listener) => {
    listener();
  });
}

/** 루트·유틸·화학·관리자 등 모든 스택을 비우고 메인 홈 탭으로 복귀 */
export function resetNavigationToHome(): void {
  const dispatchReset = () => {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            state: {
              routes: [{ name: 'Home' }],
              index: 0,
            },
          },
        ],
      }),
    );
  };

  if (!navigationRef.isReady()) {
    const interval = setInterval(() => {
      if (navigationRef.isReady()) {
        clearInterval(interval);
        dispatchReset();
      }
    }, 100);
    return;
  }

  dispatchReset();
}

/** 상단 KON 브랜드 탭 — 내비게이션 스택 초기화 + 홈 데이터 강제 새로고침 */
export function navigateHomeFromHeader(): void {
  resetNavigationToHome();
  triggerHomeScreenRefresh();
}
