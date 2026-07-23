import type { ComponentType } from 'react';

/** 탭/스택 진입 시점에만 require — Expo Go 초기 번들 실행 부담 감소 */
export function createDeferredScreen<P extends object>(
  loader: () => ComponentType<P>,
): ComponentType<P> {
  let Screen: ComponentType<P> | null = null;
  return function DeferredScreen(props: P) {
    if (!Screen) {
      Screen = loader();
    }
    const Resolved = Screen;
    return <Resolved {...props} />;
  };
}
