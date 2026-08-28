import { createContext, type ReactNode } from 'react';

/**
 * 숏코드 피커는 각 `ShortcodeTextInput`이 로컬 상태로 처리합니다.
 * 앱 트리 호환을 위해 Provider 래퍼만 유지합니다.
 */
const ShortcodeComposerContext = createContext<null>(null);

export function ShortcodeComposerProvider({ children }: { children: ReactNode }) {
  return (
    <ShortcodeComposerContext.Provider value={null}>{children}</ShortcodeComposerContext.Provider>
  );
}
