import { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import {
  EmsCommunityWriteModal,
  WriteFieldLabel,
  WriteFormField,
  getFirstWriteValidationError,
  isWriteFormValid,
} from '@/components/emsCommunity/EmsCommunityWriteModal';
import { LoungeFilterPill, LoungeFilterRow, LoungeInput } from '@/components/emsCommunity/loungeUi';
import { KEMIX_RESOURCE_CATEGORIES } from '@/constants/resourceCategories';

export type ResourceWriteInput = {
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileName: string;
};

const TITLE_MIN = 2;

type ResourceWriteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (input: ResourceWriteInput) => Promise<void>;
};

/** 자료실 탭 전용 업로드 모달 — 저장·리스트 갱신은 부모 `onSave`에서 처리 */
export function ResourceWriteModal({ visible, onClose, onSave }: ResourceWriteModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [submitting, setSubmitting] = useState(false);

  const validationRules = useMemo(
    () => [
      { id: 'title', label: '제목', value: title, minLength: TITLE_MIN, required: true },
      { id: 'fileUrl', label: '파일 URL', value: fileUrl, required: true },
      { id: 'fileName', label: '파일명', value: fileName, required: true },
    ],
    [title, fileUrl, fileName],
  );

  const submitReady = isWriteFormValid(validationRules);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFileUrl('');
    setFileName('');
    setCategory('general');
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
    const trimmedUrl = fileUrl.trim();
    const trimmedFileName = fileName.trim();

    setSubmitting(true);
    try {
      await onSave({
        title: trimmedTitle,
        description: description.trim(),
        category,
        fileUrl: trimmedUrl,
        fileName: trimmedFileName,
      });
      resetForm();
      onClose();
      Alert.alert('등록 완료', '자료가 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        err instanceof Error ? err.message : '자료 등록에 실패했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EmsCommunityWriteModal
      visible={visible}
      title="자료 등록"
      submitLabel="자료 등록"
      submitting={submitting}
      submitReady={submitReady}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <View style={{ marginBottom: 12 }}>
        <WriteFieldLabel required>분류</WriteFieldLabel>
        <LoungeFilterRow>
          {KEMIX_RESOURCE_CATEGORIES.map((item) => (
            <LoungeFilterPill
              key={item.value}
              label={item.label}
              active={category === item.value}
              onPress={() => setCategory(item.value)}
            />
          ))}
        </LoungeFilterRow>
      </View>

      <WriteFormField label="제목" required value={title} minLength={TITLE_MIN}>
        <LoungeInput value={title} onChangeText={setTitle} placeholder="자료 제목 (2자 이상)" />
      </WriteFormField>

      <WriteFormField label="설명" optional value={description}>
        <LoungeInput
          value={description}
          onChangeText={setDescription}
          placeholder="설명"
          multiline
          minHeight={72}
        />
      </WriteFormField>

      <WriteFormField label="파일 URL" required value={fileUrl} showStatus>
        <LoungeInput value={fileUrl} onChangeText={setFileUrl} placeholder="https://..." />
      </WriteFormField>

      <WriteFormField label="파일명" required value={fileName} showStatus>
        <LoungeInput
          value={fileName}
          onChangeText={setFileName}
          placeholder="예: 응급처치_매뉴얼.pdf"
        />
      </WriteFormField>
    </EmsCommunityWriteModal>
  );
}
