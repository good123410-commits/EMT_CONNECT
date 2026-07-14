import type { ComponentType } from 'react';

/** 탭/스택 진입 시점에만 require — Expo Go 초기 번들 실행 부담 감소 */
export function createDeferredScreen(loader: () => ComponentType): ComponentType {
  let Screen: ComponentType | null = null;
  return function DeferredScreen() {
    if (!Screen) {
      Screen = loader();
    }
    const Resolved = Screen;
    return <Resolved />;
  };
}
