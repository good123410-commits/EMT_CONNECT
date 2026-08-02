import { createContext, useContext } from 'react';

type ParamedicTabLayoutContextValue = {
  /** 메인 하단 탭 바로 위에 붙는 EMS 서브 탭 (safe area 이중 적용 방지) */
  nestedAboveMainTabBar: boolean;
};

export const ParamedicTabLayoutContext = createContext<ParamedicTabLayoutContextValue>({
  nestedAboveMainTabBar: true,
});

export function useParamedicTabLayout() {
  return useContext(ParamedicTabLayoutContext);
}
