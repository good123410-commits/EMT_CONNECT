import { Alert, Platform } from 'react-native';

export function confirmDestructiveAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmLabel = '삭제',
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => void onConfirm(),
    },
  ]);
}
