import { Modal, Pressable, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmModal({
  visible,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-end bg-black/45">
        <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-slate-200" />
          </View>
          <Text className="text-lg font-bold text-slate-900">{title}</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-600">{message}</Text>
          <Pressable
            className={`mt-6 items-center rounded-xl py-3.5 ${
              loading
                ? 'bg-slate-300'
                : destructive
                  ? 'bg-red-600'
                  : 'bg-violet-700'
            }`}
            disabled={loading}
            onPress={onConfirm}
          >
            <Text className="font-bold text-white">{loading ? '처리 중...' : confirmLabel}</Text>
          </Pressable>
          <Pressable className="mt-3 items-center py-2" disabled={loading} onPress={onCancel}>
            <Text className="font-semibold text-slate-500">{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
