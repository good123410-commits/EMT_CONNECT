import { useState } from 'react';
import { Alert } from 'react-native';
import {
  EmsCommunityWriteModal,
  WriteFieldLabel,
} from '@/components/emsCommunity/EmsCommunityWriteModal';
import { LoungeInput } from '@/components/emsCommunity/loungeUi';

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

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setBody('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (trimmedTitle.length < 4) {
      Alert.alert('입력 확인', '제목을 4자 이상 입력해 주세요.');
      return;
    }
    if (trimmedBody.length < 10) {
      Alert.alert('입력 확인', '본문을 10자 이상 입력해 주세요.');
      return;
    }

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
      onClose={handleClose}
      onSubmit={() => void handleSubmit()}
    >
      <WriteFieldLabel>제목</WriteFieldLabel>
      <LoungeInput value={title} onChangeText={setTitle} placeholder="케이스 제목" />
      <WriteFieldLabel>한 줄 요약</WriteFieldLabel>
      <LoungeInput value={summary} onChangeText={setSummary} placeholder="핵심 내용 요약 (선택)" />
      <WriteFieldLabel>본문</WriteFieldLabel>
      <LoungeInput
        value={body}
        onChangeText={setBody}
        placeholder="처치 경과·교훈 (환자 실명·식별정보 금지)"
        multiline
        minHeight={160}
      />
    </EmsCommunityWriteModal>
  );
}
