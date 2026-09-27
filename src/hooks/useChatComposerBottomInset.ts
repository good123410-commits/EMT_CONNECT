import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

type UseChatComposerBottomInsetOptions = {
  /** EMS 커뮤니티 허브 등 탭+FAB 여백이 큰 embedded 목록에서 진입한 경우 */
  reduceFabPadding?: boolean;
};

/**
 * 채팅 입력창 하단 padding — 키보드 표시 시 FAB용 큰 inset 대신 safe area만 사용.
 */
export function useChatComposerBottomInset(options: UseChatComposerBottomInsetOptions = {}): number {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const fabBottomInset = useGlobalFabBottomInset();

  if (keyboardHeight > 0) {
    return Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12);
  }

  if (options.reduceFabPadding) {
    return Math.max(12, fabBottomInset - 48);
  }

  return Math.max(12, insets.bottom);
}
