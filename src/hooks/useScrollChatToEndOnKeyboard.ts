import { useEffect, type RefObject } from 'react';
import { Keyboard, Platform } from 'react-native';
import type { FlatList } from 'react-native';

export function useScrollChatToEndOnKeyboard<T>(listRef: RefObject<FlatList<T> | null>): void {
  useEffect(() => {
    const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const subscription = Keyboard.addListener(eventName, () => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    });
    return () => subscription.remove();
  }, [listRef]);
}
