import { useCallback, useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, FlatList, Modal, ScrollView, Text, View } from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import { adminListKemiPosts } from '@/services/adminService';
import { createKemiGuide, deleteKemiGuide } from '@/services/kemiPostService';
import type { AdminKemiPost } from '@/types/admin';

export function AdminContentPanel() {
  const [guides, setGuides] = useState<AdminKemiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [guideFormVisible, setGuideFormVisible] = useState(false);
  const [guideTitle, setGuideTitle] = useState('');
  const [guideCategory, setGuideCategory] = useState('기타');
  const [guideContent, setGuideContent] = useState('');
  const [deleteGuideTarget, setDeleteGuideTarget] = useState<AdminKemiPost | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const guideRows = await adminListKemiPosts({ includeUnpublished: true, limit: 100 }).catch(
        () => [] as AdminKemiPost[],
      );
      setGuides(guideRows);
    } catch (error) {
      Alert.alert('조회 실패', error instanceof Error ? error.message : '콘텐츠를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreateGuide = async () => {
    if (!guideTitle.trim() || !guideContent.trim()) {
      Alert.alert('입력 필요', '제목과 내용을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await createKemiGuide({
        title: guideTitle.trim(),
        category: guideCategory.trim() || '기타',
        content: guideContent.trim(),
        isPublished: true,
      });
      setGuideFormVisible(false);
      setGuideTitle('');
      setGuideContent('');
      await reload();
      Alert.alert('완료', '응급처치 가이드가 등록되었습니다.');
    } catch (error) {
      Alert.alert('실패', error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGuide = async () => {
    if (!deleteGuideTarget) return;
    setSubmitting(true);
    try {
      await deleteKemiGuide(deleteGuideTarget.id);
      setDeleteGuideTarget(null);
      await reload();
      Alert.alert('완료', '가이드가 삭제되었습니다.');
    } catch (error) {
      Alert.alert('실패', error instanceof Error ? error.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text className="text-sm font-semibold text-kemix-text-secondary">응급처치 가이드</Text>

      <Pressable
        className="mt-3 items-center rounded-xl bg-violet-700 py-3"
        onPress={() => setGuideFormVisible(true)}
      >
        <Text className="font-bold text-white">+ 응급처치 가이드 추가</Text>
      </Pressable>

      <FlatList
        data={guides}
        keyExtractor={(item) => item.id}
        className="mt-3"
        contentContainerClassName="pb-6"
        ListEmptyComponent={
          <Text className="py-8 text-center text-sm text-kemix-text-secondary">등록된 가이드가 없습니다.</Text>
        }
        renderItem={({ item }) => (
          <View className="mb-2 rounded-xl border border-kemix-border bg-kemix-surface p-3">
            <Text className="font-semibold text-kemix-text">{item.title}</Text>
            <Text className="mt-0.5 text-xs text-kemix-text-secondary">
              {item.category ?? '기타'} · {item.is_published ? '공개' : '비공개'}
            </Text>
            <Pressable
              className="mt-2 self-start rounded-lg bg-red-100 px-2.5 py-1"
              onPress={() => setDeleteGuideTarget(item)}
            >
              <Text className="text-[11px] font-bold text-red-700">삭제</Text>
            </Pressable>
          </View>
        )}
      />

      <Modal visible={guideFormVisible} animationType="slide" onRequestClose={() => setGuideFormVisible(false)}>
        <View className="flex-1 bg-kemix-bg">
          <ScrollView contentContainerClassName="p-4 pb-10">
            <Text className="mb-4 text-lg font-bold text-kemix-text">응급처치 가이드 추가</Text>
            <AdminFormField label="제목" value={guideTitle} onChangeText={setGuideTitle} placeholder="가이드 제목" />
            <AdminFormField label="분류" value={guideCategory} onChangeText={setGuideCategory} placeholder="예: 심정지" />
            <AdminFormField
              label="내용"
              value={guideContent}
              onChangeText={setGuideContent}
              placeholder="단계별 응급처치 내용"
              multiline
            />
            <Pressable
              className={`items-center rounded-xl py-3 ${submitting ? 'bg-violet-300' : 'bg-violet-700'}`}
              disabled={submitting}
              onPress={() => void handleCreateGuide()}
            >
              <Text className="font-bold text-white">{submitting ? '저장 중...' : '저장'}</Text>
            </Pressable>
            <Pressable className="mt-3 items-center py-2" onPress={() => setGuideFormVisible(false)}>
              <Text className="font-semibold text-kemix-text-secondary">취소</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <AdminConfirmModal
        visible={!!deleteGuideTarget}
        title="가이드 삭제"
        message={`"${deleteGuideTarget?.title}" 가이드를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={submitting}
        onConfirm={() => void handleDeleteGuide()}
        onCancel={() => setDeleteGuideTarget(null)}
      />
    </View>
  );
}
