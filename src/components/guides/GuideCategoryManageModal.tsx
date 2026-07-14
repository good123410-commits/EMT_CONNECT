import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveGuideIcon } from '@/constants/guideIcons';
import {
  deleteGuideCategory,
  isPersistedGuideCategory,
  type GuideCategory,
} from '@/services/guideCategoryService';

type GuideCategoryManageModalProps = {
  visible: boolean;
  categories: GuideCategory[];
  onClose: () => void;
  onDeleted: (category: GuideCategory) => void;
};

export function GuideCategoryManageModal({
  visible,
  categories,
  onClose,
  onDeleted,
}: GuideCategoryManageModalProps) {
  const insets = useSafeAreaInsets();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (category: GuideCategory) => {
    if (!isPersistedGuideCategory(category)) {
      Alert.alert(
        '삭제 불가',
        '글에서 자동으로 표시되는 분류입니다. Supabase guide_categories에 등록된 분류만 삭제할 수 있습니다.',
      );
      return;
    }

    Alert.alert('분류 삭제', `"${category.name}" 분류를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(category.id);
          try {
            await deleteGuideCategory(category);
            onDeleted(category);
            Alert.alert('삭제 완료', `"${category.name}" 분류가 삭제되었습니다.`);
          } catch (err) {
            Alert.alert('삭제 실패', err instanceof Error ? err.message : '다시 시도해 주세요.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[70%] rounded-t-3xl bg-white"
          style={{ paddingBottom: insets.bottom + 16 }}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="border-b border-slate-200 px-4 py-4">
            <Text className="text-center text-base font-bold text-slate-900">분류 관리</Text>
            <Text className="mt-1 text-center text-xs text-slate-500">
              글이 없는 분류만 삭제할 수 있습니다
            </Text>
          </View>

          <ScrollView className="px-4 py-3" contentContainerClassName="gap-2 pb-4">
            {categories.map((category) => {
              const iconName = resolveGuideIcon(category.icon);
              const canDelete = isPersistedGuideCategory(category);
              const deleting = deletingId === category.id;

              return (
                <View
                  key={category.id}
                  className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <View className="mr-3 rounded-lg bg-white p-2">
                    <Ionicons name={iconName} size={18} color="#dc2626" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-900">{category.name}</Text>
                    <Text className="text-xs text-slate-500">
                      {canDelete ? '삭제 가능' : '자동 표시 분류'}
                    </Text>
                  </View>
                  {canDelete ? (
                    <Pressable
                      className="rounded-full bg-red-50 p-2"
                      onPress={() => handleDelete(category)}
                      disabled={deleting}
                      hitSlop={8}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      )}
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
            {categories.length === 0 ? (
              <Text className="py-8 text-center text-sm text-slate-500">등록된 분류가 없습니다.</Text>
            ) : null}
          </ScrollView>

          <View className="border-t border-slate-200 px-4 pt-3">
            <Pressable className="items-center rounded-xl bg-slate-900 py-3" onPress={onClose}>
              <Text className="text-sm font-bold text-white">닫기</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
