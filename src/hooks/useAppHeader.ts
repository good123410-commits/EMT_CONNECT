import { useEffect } from 'react';
import { useAppHeaderContext, type AppHeaderOverride } from '@/contexts/AppHeaderContext';

/**
 * 화면별 헤더 타이틀·뒤로가기 동작을 덮어씁니다. 언마운트 시 자동 초기화.
 */
export function useAppHeader(override: AppHeaderOverride | null): void {
  const { setOverride } = useAppHeaderContext();

  useEffect(() => {
    setOverride(override);
    return () => setOverride(null);
  }, [override, setOverride]);
}
