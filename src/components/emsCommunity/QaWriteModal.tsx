import { useEffect, useMemo, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import {
  EmsCommunityWriteModal,
  WriteFormField,
  getFirstWriteValidationError,
  isWriteFormValid,
} from '@/components/emsCommunity/EmsCommunityWriteModal';
import { LoungeInput } from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

export type QaWriteInput = {
  title: string;
  content: string;
  isSecret: boolean;
};

export type QaEditingPost = {
  id: string;
  title: string;
  content: string;
  isSecret: boolean;
};

const TITLE_MIN = 2;
const CONTENT_MIN = 5;

type QaWriteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (input: QaWriteInput) => Promise<void>;
  editingPost?: QaEditingPost | null;
};

/** 질문함 탭 전용 작성/수정 모달 */
export function QaWriteModal({ visible, onClose, onSave, editingPost }: QaWriteModalProps) {
  const { lounge } = useEmsLoungeTheme();
  const isEditing = Boolean(editingPost?.id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validationRules = useMemo(
    () => [
      { id: 'title', label: '제목', value: title, minLength: TITLE_MIN, required: true },
      { id: 'content', label: '내용', value: content, minLength: CONTENT_MIN, required: true },
    ],
    [title, content],
  );

  const submitReady = isWriteFormValid(validationRules);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsSecret(false);
    setSubmitting(false);
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
      return;
    }
    if (editingPost) {
      setTitle(editingPost.title);
      setContent(editingPost.content);
      setIsSecret(editingPost.isSecret);
      return;
    }
    resetForm();
  }, [visible, editingPost]);

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const validationError = getFirstWriteValidationError(validationRules);
    if (validationError) {
      Alert.alert('입력 확인', validationError);
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        isSecret,
      });
      resetForm();
      onClose();
      Alert.alert('완료', isEditing ? '질문이 수정되었습니다.' : '질문이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        isEditing ? '수정 실패' : '등록 실패',
        err instanceof Error ? err.message : '다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EmsCommunityWriteModal
      visible={visible}
      title={isEditing ? '질문 수정' : '질문 작성'}
      submitLabel={isEditing ? '수정 저장' : '질문 등록'}
      submitting={submitting}
      submitReady={submitReady}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <WriteFormField label="제목" required value={title} minLength={TITLE_MIN}>
        <LoungeInput value={title} onChangeText={setTitle} placeholder="질문 제목 (2자 이상)" />
      </WriteFormField>

      <WriteFormField label="내용" required value={content} minLength={CONTENT_MIN}>
        <LoungeInput
          value={content}
          onChangeText={setContent}
          placeholder="상황을 구체적으로 적어 주세요 (5자 이상)"
          multiline
          minHeight={160}
        />
      </WriteFormField>

      <View className="mb-2 flex-row items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: lounge.border, backgroundColor: lounge.background }}>
        <View className="flex-1 pr-3">
          <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 14, color: lounge.text }}>
            비밀글로 작성
          </Text>
          <Text style={{ marginTop: 2, fontFamily: 'Pretendard', fontSize: 12, color: lounge.textMuted }}>
            작성자와 관리자만 내용을 볼 수 있습니다
          </Text>
        </View>
        <Switch
          value={isSecret}
          onValueChange={setIsSecret}
          trackColor={{ false: lounge.border, true: lounge.accentMuted }}
          thumbColor={isSecret ? lounge.accent : lounge.textMuted}
        />
      </View>
    </EmsCommunityWriteModal>
  );
}
