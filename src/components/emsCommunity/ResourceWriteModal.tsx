import { useState } from 'react';
import { Alert } from 'react-native';
import {
  EmsCommunityWriteModal,
  WriteFieldLabel,
} from '@/components/emsCommunity/EmsCommunityWriteModal';
import { LoungeFilterPill, LoungeFilterRow, LoungeInput } from '@/components/emsCommunity/loungeUi';
import { KEMIX_RESOURCE_CATEGORIES } from '@/constants/resourceCategories';
import { adminUpsertKemixResource } from '@/services/kemixResourceService';

type ResourceWriteModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function ResourceWriteModal({ visible, onClose, onCreated }: ResourceWriteModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFileUrl('');
    setFileName('');
    setCategory('general');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (title.trim().length < 2) {
      Alert.alert('입력 확인', '제목을 2자 이상 입력해 주세요.');
      return;
    }
    if (!fileUrl.trim()) {
      Alert.alert('입력 확인', '파일 URL을 입력해 주세요.');
      return;
    }
    if (!fileName.trim()) {
      Alert.alert('입력 확인', '파일명을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await adminUpsertKemixResource({
        title: title.trim(),
        description: description.trim(),
        category,
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim(),
        isPublished: true,
      });
      resetForm();
      onClose();
      onCreated?.();
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
      onClose={handleClose}
      onSubmit={() => void handleSubmit()}
    >
      <WriteFieldLabel>분류</WriteFieldLabel>
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

      <WriteFieldLabel>제목</WriteFieldLabel>
      <LoungeInput value={title} onChangeText={setTitle} placeholder="자료 제목" />

      <WriteFieldLabel>설명</WriteFieldLabel>
      <LoungeInput
        value={description}
        onChangeText={setDescription}
        placeholder="설명 (선택)"
        multiline
        minHeight={72}
      />

      <WriteFieldLabel>파일 URL</WriteFieldLabel>
      <LoungeInput value={fileUrl} onChangeText={setFileUrl} placeholder="https://..." />

      <WriteFieldLabel>파일명</WriteFieldLabel>
      <LoungeInput
        value={fileName}
        onChangeText={setFileName}
        placeholder="예: 응급처치_매뉴얼.pdf"
      />
    </EmsCommunityWriteModal>
  );
}
