import { useEffect, useRef } from 'react';
import { useAppHeaderContext, type AppHeaderOverride } from '@/contexts/AppHeaderContext';

/**
 * 화면별 헤더 타이틀·뒤로가기 동작을 덮어씁니다. 언마운트 시 자동 초기화.
 */
export function useAppHeader(override: AppHeaderOverride | null): void {
  const { setOverride } = useAppHeaderContext();
  const onBackRef = useRef(override?.onBack);
  onBackRef.current = override?.onBack;

  const hasOverride = override != null;
  const title = override?.title;
  const hidden = override?.hidden;
  const showBack = override?.showBack;

  useEffect(() => {
    if (!hasOverride) {
      setOverride(null);
      return () => setOverride(null);
    }

    setOverride({
      title,
      hidden,
      showBack,
      onBack: () => onBackRef.current?.(),
    });
    return () => setOverride(null);
  }, [hasOverride, title, hidden, showBack, setOverride]);
}
