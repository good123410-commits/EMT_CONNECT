import { Alert, Platform } from 'react-native';

async function runConfirmAction(onConfirm: () => void | Promise<void>): Promise<void> {
  try {
    await onConfirm();
  } catch (error) {
    Alert.alert(
      '처리 실패',
      error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
    );
  }
}

export function confirmDestructiveAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  confirmLabel = '삭제',
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      void runConfirmAction(onConfirm);
    }
    return;
  }

  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => void runConfirmAction(onConfirm),
    },
  ]);
}
