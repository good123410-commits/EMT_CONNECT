import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  EmsCommunityWriteModal,
  WriteFormField,
  getFirstWriteValidationError,
  isWriteFormValid,
} from '@/components/emsCommunity/EmsCommunityWriteModal';
import { LoungeInput } from '@/components/emsCommunity/loungeUi';

const TITLE_MIN = 4;
const BODY_MIN = 10;

type CaseStudyWriteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; summary: string; body: string }) => Promise<void>;
};

export function CaseStudyWriteModal({ visible, onClose, onSubmit }: CaseStudyWriteModalProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validationRules = useMemo(
    () => [
      { id: 'title', label: '제목', value: title, minLength: TITLE_MIN, required: true },
      { id: 'body', label: '본문', value: body, minLength: BODY_MIN, required: true },
    ],
    [title, body],
  );

  const submitReady = isWriteFormValid(validationRules);

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setBody('');
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
    const trimmedBody = body.trim();

    setSubmitting(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        summary: summary.trim(),
        body: trimmedBody,
      });
      resetForm();
      onClose();
      Alert.alert('등록 완료', '케이스가 익명으로 등록되었습니다. 환자 식별 정보는 포함하지 마세요.');
    } catch (err) {
      Alert.alert('등록 실패', err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EmsCommunityWriteModal
      visible={visible}
      title="케이스 작성"
      submitLabel="케이스 등록"
      submitting={submitting}
      submitReady={submitReady}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <WriteFormField label="제목" required value={title} minLength={TITLE_MIN}>
        <LoungeInput value={title} onChangeText={setTitle} placeholder="케이스 제목 (4자 이상)" />
      </WriteFormField>

      <WriteFormField label="한 줄 요약" optional value={summary}>
        <LoungeInput value={summary} onChangeText={setSummary} placeholder="핵심 내용 요약" />
      </WriteFormField>

      <WriteFormField label="본문" required value={body} minLength={BODY_MIN}>
        <LoungeInput
          value={body}
          onChangeText={setBody}
          placeholder="처치 경과·교훈 (10자 이상, 환자 실명·식별정보 금지)"
          multiline
          minHeight={160}
        />
      </WriteFormField>
    </EmsCommunityWriteModal>
  );
}
