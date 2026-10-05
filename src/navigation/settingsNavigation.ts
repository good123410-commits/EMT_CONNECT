import { navigationRef } from '@/navigation/navigationRef';
import { runDeferredOnWeb } from '@/utils/deferredOnWeb';

function dispatchNavigateToAdminDashboard(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('AdminDashboard');
}

/** 설정 시트·Modal 닫힘과 겹치지 않도록 Web에서는 렌더 턴을 분리합니다. */
export function navigateToAdminDashboard(): void {
  runDeferredOnWeb(dispatchNavigateToAdminDashboard);
}
