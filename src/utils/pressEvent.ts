import { Platform } from 'react-native';

type PressEvent = { stopPropagation?: () => void };

export function stopPressPropagation(event?: PressEvent): void {
  if (Platform.OS === 'web') {
    event?.stopPropagation?.();
  }
}

export function withStopPropagation(handler: () => void) {
  return (event?: PressEvent) => {
    stopPressPropagation(event);
    handler();
  };
}
