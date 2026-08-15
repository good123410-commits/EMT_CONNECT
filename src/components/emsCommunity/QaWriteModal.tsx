import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  EmsCommunityWriteModal,
  WriteFormField,
  getFirstWriteValidationError,
  isWriteFormValid,
} from '@/components/emsCommunity/EmsCommunityWriteModal';
import { LoungeInput } from '@/components/emsCommunity/loungeUi';

export type QaWriteInput = {
  title: string;
  content: string;
};

const TITLE_MIN = 2;
const CONTENT_MIN = 5;

type QaWriteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (input: QaWriteInput) => Promise<void>;
};

/** 질문함 탭 전용 작성 모달 — 저장·리스트 갱신은 부모 `onSave`에서 처리 */
export function QaWriteModal({ visible, onClose, onSave }: QaWriteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
    setSubmitting(false);
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

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

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    setSubmitting(true);
    try {
      await onSave({ title: trimmedTitle, content: trimmedContent });
      resetForm();
      onClose();
      Alert.alert('등록 완료', '질문이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        err instanceof Error ? err.message : '다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EmsCommunityWriteModal
      visible={visible}
      title="질문 작성"
      submitLabel="질문 등록"
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
    </EmsCommunityWriteModal>
  );
}
