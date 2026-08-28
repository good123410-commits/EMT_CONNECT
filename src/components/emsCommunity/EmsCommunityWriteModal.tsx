import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Pressable, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { LoungePrimaryButton } from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

export {
  WriteFieldCount,
  WriteFieldLabel,
  WriteFieldStatus,
  WriteFormField,
  getFirstWriteValidationError,
  isWriteFormValid,
} from '@/components/emsCommunity/communityWriteForm';
export type { WriteFieldRule } from '@/components/emsCommunity/communityWriteForm';

type EmsCommunityWriteModalProps = {
  visible: boolean;
  title: string;
  submitLabel: string;
  submitting?: boolean;
  /** false이면 등록 버튼이 흐리게 표시되며, 탭 시 유효성 안내가 실행됨 */
  submitReady?: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  children: ReactNode;
};

/** 질문함·케이스·자료 등 공통 전체 화면 작성 모달 */
export function EmsCommunityWriteModal({
  visible,
  title,
  submitLabel,
  submitting = false,
  submitReady = true,
  onClose,
  onSubmit,
  children,
}: EmsCommunityWriteModalProps) {
  const { lounge } = useEmsLoungeTheme();
  const submitLockRef = useRef(false);

  const handleSubmitPress = async () => {
    if (submitting || submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      await onSubmit();
    } finally {
      submitLockRef.current = false;
    }
  };

  const buttonDimmed = !submitReady && !submitting;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: lounge.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: lounge.surface, borderBottomWidth: 1, borderBottomColor: lounge.border }}
        >
          <Text style={{ fontFamily: 'Pretendard-Bold', fontSize: 18, color: lounge.text }}>{title}</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            hitSlop={8}
            disabled={submitting}
          >
            <Ionicons name="close" size={24} color={lounge.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Text
            style={{
              marginBottom: 16,
              fontFamily: 'Pretendard',
              fontSize: 12,
              lineHeight: 18,
              color: lounge.textMuted,
            }}
          >
            <Text style={{ color: lounge.error, fontFamily: 'Pretendard-Bold' }}>*</Text> 표시는 필수
            항목입니다. 글자 수는 입력 즉시 반영됩니다.
          </Text>

          {children}

          <LoungePrimaryButton
            label={submitting ? '등록 중…' : submitLabel}
            disabled={submitting}
            dimmed={buttonDimmed}
            onPress={() => void handleSubmitPress()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
