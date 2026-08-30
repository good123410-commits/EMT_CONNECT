import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
import type { EmergencyTickerDashboardItem } from '@/types/emergencyTicker';

type AdminEmergencyTickerItemEditModalProps = {
  visible: boolean;
  item: EmergencyTickerDashboardItem | null;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
};

export function AdminEmergencyTickerItemEditModal({
  visible,
  item,
  onClose,
  onSubmit,
}: AdminEmergencyTickerItemEditModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible || !item) return;
    setMessage(item.displayMessage);
  }, [visible, item?.itemKey, item?.displayMessage]);

  const handleSave = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(message.trim());
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
          <Text className="text-lg font-bold text-kemix-text">전광판 문구 수정</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="p-4 pb-10">
          {item?.originalMessage !== item?.displayMessage ? (
            <Text className="mb-3 text-xs leading-5 text-kemix-text-secondary">
              원문: {item?.originalMessage}
            </Text>
          ) : null}

          <AdminFormField
            label="송출 문구"
            value={message}
            onChangeText={setMessage}
            placeholder="전광판에 표시할 문구"
            multiline
          />

          <Pressable
            className={`mt-2 items-center rounded-xl py-3.5 ${submitting || !message.trim() ? 'bg-slate-300' : 'bg-slate-800'}`}
            disabled={submitting || !message.trim()}
            onPress={() => void handleSave()}
          >
            <Text className="font-bold text-white">{submitting ? '저장 중…' : '저장'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
