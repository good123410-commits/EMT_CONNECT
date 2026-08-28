import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, type View } from 'react-native';

export type ShortcodePickerAnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function useShortcodePickerAnchor(active: boolean) {
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<ShortcodePickerAnchorRect | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const measureAnchor = useCallback(() => {
    const node = anchorRef.current;
    if (!node) return;

    node.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) return;
      setAnchor({ x, y, width, height });
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      requestAnimationFrame(measureAnchor);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      requestAnimationFrame(measureAnchor);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [measureAnchor]);

  useEffect(() => {
    if (!active) {
      setAnchor(null);
      return;
    }

    measureAnchor();
    const frame = requestAnimationFrame(measureAnchor);
    const timer = setTimeout(measureAnchor, 64);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [active, keyboardHeight, measureAnchor]);

  return {
    anchorRef,
    anchor,
    keyboardHeight,
    measureAnchor,
  };
}
