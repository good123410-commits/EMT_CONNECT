import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
import type { HomeEmergencyNotice } from '@/types/emergencyTicker';

export type EmergencyNoticeFormValues = {
  message: string;
  isActive: boolean;
};

const EMPTY_FORM: EmergencyNoticeFormValues = {
  message: '',
  isActive: true,
};

type AdminEmergencyNoticeFormModalProps = {
  visible: boolean;
  editing: HomeEmergencyNotice | null;
  onClose: () => void;
  onSubmit: (values: EmergencyNoticeFormValues) => Promise<void>;
};

export function AdminEmergencyNoticeFormModal({
  visible,
  editing,
  onClose,
  onSubmit,
}: AdminEmergencyNoticeFormModalProps) {
  const [form, setForm] = useState<EmergencyNoticeFormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const editingId = editing?.id ?? null;

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setForm({
        message: editing.message,
        isActive: editing.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [visible, editingId]);

  const handleSave = async () => {
    if (!form.message.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-kemix-bg"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center justify-between border-b border-kemix-border bg-kemix-surface px-4 py-3">
          <Text className="text-lg font-bold text-kemix-text">
            {editing ? '긴급 공지 수정' : '긴급 공지 추가'}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="p-4 pb-10">
          <Text className="mb-3 text-xs leading-5 text-kemix-text-secondary">
            홈 상단 전광판에 최우선으로 노출됩니다. 공공 API 재난 알림보다 앞에 표시됩니다.
          </Text>

          <AdminFormField
            label="긴급 공지 내용"
            value={form.message}
            onChangeText={(text) => setForm((prev) => ({ ...prev, message: text }))}
            placeholder="예: 서울 전역 호우주의보 발령 — 외출 자제"
            multiline
          />

          <View className="mb-4 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-4 py-3">
            <Text className="text-sm font-semibold text-kemix-text">전광판 노출</Text>
            <Switch
              value={form.isActive}
              onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
            />
          </View>

          <Pressable
            className={`items-center rounded-xl py-3.5 ${submitting || !form.message.trim() ? 'bg-red-300' : 'bg-red-600'}`}
            disabled={submitting || !form.message.trim()}
            onPress={() => void handleSave()}
          >
            <Text className="font-bold text-white">{submitting ? '저장 중…' : '저장'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
