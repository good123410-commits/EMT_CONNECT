import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import type { ParamedicWriteTab } from '@/navigation/paramedicWriteTab';

type UseParamedicTabWriteOptions = {
  /** false면 포커스 시에도 핸들러를 등록하지 않음 */
  enabled?: boolean;
};

/**
 * EMS 커뮤니티 탭 글쓰기 FAB 핸들러 등록.
 * - 마운트 시 핸들러 등록(탭 전환 레이스 방지), 포커스 시 활성 탭만 갱신
 * - handler ref로 최신 클로저 유지
 */
export function useParamedicTabWrite(
  tab: ParamedicWriteTab,
  handler: () => void,
  options: UseParamedicTabWriteOptions = {},
) {
  const { registerTabWriteHandler, setActiveWriteTab } = useParamedicCommunity();
  const enabled = options.enabled !== false;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const registerEffect = useCallback(() => {
    if (!enabled) {
      registerTabWriteHandler(tab, null);
      return () => registerTabWriteHandler(tab, null);
    }

    const invoke = () => handlerRef.current();
    registerTabWriteHandler(tab, invoke);
    return () => registerTabWriteHandler(tab, null);
  }, [enabled, registerTabWriteHandler, tab]);

  useLayoutEffect(() => {
    return registerEffect();
  }, [registerEffect]);

  useFocusEffect(
    useCallback(() => {
      setActiveWriteTab(tab);
    }, [tab, setActiveWriteTab]),
  );
}
