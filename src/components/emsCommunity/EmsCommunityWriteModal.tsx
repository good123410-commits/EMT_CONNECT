import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { LoungePrimaryButton } from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

type EmsCommunityWriteModalProps = {
  visible: boolean;
  title: string;
  submitLabel: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
};

/** 질문함 작성 모달과 동일한 전체 화면 슬라이드 스타일 */
export function EmsCommunityWriteModal({
  visible,
  title,
  submitLabel,
  submitting = false,
  onClose,
  onSubmit,
  children,
}: EmsCommunityWriteModalProps) {
  const { lounge } = useEmsLoungeTheme();

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
          <Pressable onPress={onClose} accessibilityLabel="닫기" hitSlop={8}>
            <Ionicons name="close" size={24} color={lounge.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {children}
          <LoungePrimaryButton
            label={submitting ? '등록 중…' : submitLabel}
            onPress={() => {
              if (!submitting) onSubmit();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type WriteFieldLabelProps = {
  children: string;
};

export function WriteFieldLabel({ children }: WriteFieldLabelProps) {
  const { lounge } = useEmsLoungeTheme();
  return (
    <Text
      style={{
        marginBottom: 4,
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 12,
        color: lounge.textMuted,
      }}
    >
      {children}
    </Text>
  );
}
