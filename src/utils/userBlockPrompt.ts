import { Alert } from 'react-native';
import type { BlockAuthorInput } from '@/types/userBlocks';

export function confirmBlockUser(
  input: BlockAuthorInput,
  onConfirm: (input: BlockAuthorInput) => Promise<void>,
): void {
  Alert.alert(
    '유저 차단',
    `${input.anonymousLabel} 님을 차단하시겠습니까?\n차단한 유저의 글과 메시지는 더 이상 표시되지 않습니다.`,
    [
      { text: '취소', style: 'cancel' },
      {
        text: '차단',
        style: 'destructive',
        onPress: () => {
          void onConfirm(input)
            .then(() => {
              Alert.alert('차단 완료', '해당 유저의 콘텐츠가 숨김 처리되었습니다.');
            })
            .catch((error) => {
              Alert.alert(
                '차단 실패',
                error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
              );
            });
        },
      },
    ],
  );
}
