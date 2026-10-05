import { Platform } from 'react-native';

/** Web(React 19): 클릭과 오버레이 state 업데이트가 같은 턴에 겹치지 않도록 미룹니다. */
export function runDeferredOnWeb(action: () => void): void {
  if (Platform.OS === 'web') {
    setTimeout(action, 0);
    return;
  }
  action();
}
