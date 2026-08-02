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
import { emailGuideShare, shareGuideOnKakao } from '@/utils/guideShare';

type GuideShareSheetProps = {
  guide: KemiGuide | null;
  visible: boolean;
  onClose: () => void;
};

export function GuideShareSheet({ guide, visible, onClose }: GuideShareSheetProps) {
  const insets = useSafeAreaInsets();
  const [sharing, setSharing] = useState<'kakao' | 'email' | null>(null);

  if (!guide) return null;

  const handleKakao = async () => {
    setSharing('kakao');
    try {
      await shareGuideOnKakao(guide);
      onClose();
    } catch (err) {
      Alert.alert(
        '공유 실패',
        err instanceof Error ? err.message : '카카오톡 공유에 실패했습니다.',
      );
    } finally {
      setSharing(null);
    }
  };

  const handleEmail = async () => {
    setSharing('email');
    try {
      await emailGuideShare(guide);
      onClose();
    } catch (err) {
      Alert.alert(
        '이메일 열기 실패',
        err instanceof Error ? err.message : '이메일 앱을 열 수 없습니다.',
      );
    } finally {
      setSharing(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl border border-kemix-border bg-kemix-surface px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 20 }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-kemix-border" />
          <Text className="text-lg font-bold text-kemix-text">공유하기</Text>
          <Text className="mt-1 text-sm text-kemix-text-secondary" numberOfLines={2}>
            {guide.title}
          </Text>

          <View className="mt-5 gap-3">
            <Pressable
              className="flex-row items-center justify-center rounded-xl py-4 active:opacity-90"
              style={{ backgroundColor: '#FEE500' }}
              disabled={sharing !== null}
              onPress={() => void handleKakao()}
            >
              {sharing === 'kakao' ? (
                <ActivityIndicator color="#3C1E1E" />
              ) : (
                <>
                  <Text className="text-base font-bold text-[#3C1E1E]">💬</Text>
                  <Text className="ml-2 text-base font-bold text-[#3C1E1E]">카카오톡으로 공유</Text>
                </>
              )}
            </Pressable>

            <Pressable
              className="flex-row items-center justify-center rounded-xl border border-kemix-border bg-kemix-bg py-4 active:opacity-90"
              disabled={sharing !== null}
              onPress={() => void handleEmail()}
            >
              {sharing === 'email' ? (
                <ActivityIndicator color="#334155" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={20} color="#334155" />
                  <Text className="ml-2 text-base font-bold text-kemix-text">이메일로 공유</Text>
                </>
              )}
            </Pressable>

            <Pressable className="items-center py-2 active:opacity-80" onPress={onClose}>
              <Text className="text-sm font-semibold text-kemix-text-secondary">취소</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
