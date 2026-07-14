import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Android 하드웨어 뒤로가기 — 콜백이 true를 반환하면 이벤트 소비(앱 종료 방지).
 * 자식(상세/모달)이 나중에 등록되면 LIFO 순서로 먼저 호출됩니다.
 */
export function useHardwareBackHandler(
  onBack: () => boolean | void,
  enabled = true,
): void {
  const handlerRef = useRef(onBack);
  handlerRef.current = onBack;

  useEffect(() => {
    if (!enabled) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const consumed = handlerRef.current();
      return consumed !== false;
    });

    return () => subscription.remove();
  }, [enabled]);
}
