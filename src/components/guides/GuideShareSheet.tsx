import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { KemiGuide } from '@/types/kemiGuide';
import {
  copyGuideLink,
  emailGuideShare,
  runAfterShareModalClose,
  shareGuideWithSystemSheet,
} from '@/utils/guideShare';

type GuideShareSheetProps = {
  guide: KemiGuide | null;
  visible: boolean;
  onClose: () => void;
};

type ShareAction = 'system' | 'email' | 'copy';

export function GuideShareSheet({ guide, visible, onClose }: GuideShareSheetProps) {
  const insets = useSafeAreaInsets();
  const [pendingAction, setPendingAction] = useState<ShareAction | null>(null);

  const runAction = (action: ShareAction) => {
    if (!guide || pendingAction) return;

    setPendingAction(action);
    onClose();

    runAfterShareModalClose(async () => {
      try {
        if (action === 'system') {
          await shareGuideWithSystemSheet(guide);
        } else if (action === 'email') {
          await emailGuideShare(guide);
        } else {
          await copyGuideLink(guide);
          Alert.alert('복사 완료', '가이드 링크가 클립보드에 복사되었습니다.');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '공유에 실패했습니다.';
        if (
          action === 'system' &&
          (message.includes('User did not share') ||
            (err instanceof Error && err.name === 'AbortError'))
        ) {
          return;
        }
        Alert.alert('공유 실패', message);
      } finally {
        setPendingAction(null);
      }
    });
  };

  if (!guide) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="공유 닫기" />
        <View
          className="rounded-t-3xl border border-kemix-border bg-kemix-surface px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-kemix-border" />
          <Text className="text-lg font-bold text-kemix-text">공유하기</Text>
          <Text className="mt-1 text-sm text-kemix-text-secondary" numberOfLines={2}>
            {guide.title}
          </Text>

          <View className="mt-5 gap-3">
            <Pressable
              className="flex-row items-center justify-center rounded-xl py-4 active:opacity-90"
              style={{ backgroundColor: '#047857' }}
              disabled={pendingAction !== null}
              onPress={() => runAction('system')}
            >
              {pendingAction === 'system' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={20} color="#ffffff" />
                  <Text className="ml-2 text-base font-bold text-white">
                    앱으로 공유 (카카오톡·메시지 등)
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              className="flex-row items-center justify-center rounded-xl border border-kemix-border bg-kemix-bg py-4 active:opacity-90"
              disabled={pendingAction !== null}
              onPress={() => runAction('email')}
            >
              {pendingAction === 'email' ? (
                <ActivityIndicator color="#334155" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={20} color="#334155" />
                  <Text className="ml-2 text-base font-bold text-kemix-text">이메일로 공유</Text>
                </>
              )}
            </Pressable>

            <Pressable
              className="flex-row items-center justify-center rounded-xl border border-kemix-border bg-kemix-bg py-4 active:opacity-90"
              disabled={pendingAction !== null}
              onPress={() => runAction('copy')}
            >
              {pendingAction === 'copy' ? (
                <ActivityIndicator color="#334155" />
              ) : (
                <>
                  <Ionicons name="copy-outline" size={20} color="#334155" />
                  <Text className="ml-2 text-base font-bold text-kemix-text">링크 복사</Text>
                </>
              )}
            </Pressable>

            <Pressable className="items-center py-2 active:opacity-80" onPress={onClose}>
              <Text className="text-sm font-semibold text-kemix-text-secondary">취소</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
