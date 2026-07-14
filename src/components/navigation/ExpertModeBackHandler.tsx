import { useCallback } from 'react';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';

/**
 * 전문가(히든) 모드 루트에서 하드웨어 뒤로가기 → 일반 모드로 안전 탈출.
 * 상세/모달 화면이 자체 BackHandler를 등록하면 그쪽이 우선 처리됩니다.
 */
export function ExpertModeBackHandler() {
  const { exitExpertMode } = useUserRole();

  const handleBack = useCallback(() => {
    exitExpertMode();
    return true;
  }, [exitExpertMode]);

  useHardwareBackHandler(handleBack, true);

  return null;
}
