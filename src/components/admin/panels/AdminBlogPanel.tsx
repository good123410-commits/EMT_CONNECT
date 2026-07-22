import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  adminDeleteKemiPost,
  adminListKemiPosts,
  adminUpsertKemiPost,
  AdminServiceError,
} from '@/services/adminService';
import { slugifyKemiPostTitle } from '@/services/kemiPostService';
import type { AdminKemiPost } from '@/types/admin';

const EMPTY_FORM = {
  title: '',
  slug: '',
  content: '',
  thumbnailUrl: '',
  seoTitle: '',
  seoDescription: '',
  isPublished: false,
};

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function AdminBlogPanel() {
  const [rows, setRows] = useState<AdminKemiPost[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminKemiPost | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminKemiPost | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListKemiPosts({
        search: search.trim() || undefined,
        includeUnpublished: true,
        limit: 100,
      });
      setRows(data);
    } catch (error) {
      showAlert(
        '조회 실패',
        error instanceof AdminServiceError ? error.message : '블로그 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const openCreate = () => {
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setFormVisible(true);
  };

  const openEdit = (row: AdminKemiPost) => {
    setEditingRow(row);
    setForm({
      title: row.title,
      slug: row.slug,
      content: row.content,
      thumbnailUrl: row.thumbnail_url ?? '',
      seoTitle: row.seo_title ?? '',
      seoDescription: row.seo_description ?? '',
      isPublished: row.is_published,
    });
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('입력 필요', '제목과 본문은 필수입니다.');
      return;
    }

    const slug = form.slug.trim() || slugifyKemiPostTitle(form.title);

    setSubmitting(true);
    try {
      await adminUpsertKemiPost({
        id: editingRow?.id,
        title: form.title.trim(),
        slug,
        content: form.content,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        isPublished: form.isPublished,
      });
      setFormVisible(false);
      setEditingRow(null);
      await loadRows();
      showAlert('완료', editingRow ? '수정되었습니다.' : '등록되었습니다.');
    } catch (error) {
      showAlert('실패', error instanceof AdminServiceError ? error.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await adminDeleteKemiPost(deleteTarget.id);
      setDeleteTarget(null);
      await loadRows();
      showAlert('완료', '삭제되었습니다.');
    } catch (error) {
      showAlert('실패', error instanceof AdminServiceError ? error.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1">
      <Text className="mb-2 text-xs leading-5 text-slate-500">
        KEMIX 공식 홈페이지·앱 가이드 탭에 노출되는 생활 응급처치 블로그입니다. SEO 메타 태그를 설정하면
        웹 검색 노출에 도움이 됩니다.
      </Text>

      <AdminFormField
        label="제목/슬러그 검색"
        value={search}
        onChangeText={setSearch}
        placeholder="검색 후 새로고침"
      />

      <View className="mb-3 flex-row gap-2">
        <Pressable className="flex-1 items-center rounded-xl bg-slate-200 py-2.5" onPress={() => void loadRows()}>
          <Text className="text-sm font-bold text-slate-700">새로고침</Text>
        </Pressable>
        <Pressable className="flex-1 items-center rounded-xl bg-emerald-700 py-2.5" onPress={openCreate}>
          <Text className="text-sm font-bold text-white">+ 글 작성</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#047857" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerClassName="pb-6"
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-slate-500">등록된 글이 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 font-semibold text-slate-900">{item.title}</Text>
                <Text
                  className={`text-[10px] font-bold ${
                    item.is_published ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {item.is_published ? '공개' : '비공개'}
                </Text>
              </View>
              <Text className="mt-0.5 text-xs text-slate-500">/{item.slug}</Text>
              <Text className="mt-1 text-[10px] text-slate-400">조회 {item.views}</Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable className="rounded-lg bg-slate-100 px-2.5 py-1" onPress={() => openEdit(item)}>
                  <Text className="text-[11px] font-bold text-slate-700">수정</Text>
                </Pressable>
                <Pressable className="rounded-lg bg-red-100 px-2.5 py-1" onPress={() => setDeleteTarget(item)}>
                  <Text className="text-[11px] font-bold text-red-700">삭제</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={formVisible} animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <View className="flex-1 bg-slate-50">
          <ScrollView contentContainerClassName="p-4 pb-10">
            <Text className="mb-4 text-lg font-bold text-slate-900">
              {editingRow ? '블로그 글 수정' : '블로그 글 작성'}
            </Text>

            <AdminFormField label="제목 *" value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} />
            <AdminFormField
              label="슬러그 (URL)"
              value={form.slug}
              onChangeText={(v) => setForm((p) => ({ ...p, slug: v }))}
              placeholder={form.title ? slugifyKemiPostTitle(form.title) : 'auto-generated'}
            />
            <AdminFormField
              label="본문 (HTML/Markdown) *"
              value={form.content}
              onChangeText={(v) => setForm((p) => ({ ...p, content: v }))}
              multiline
            />
            <AdminFormField
              label="썸네일 URL"
              value={form.thumbnailUrl}
              onChangeText={(v) => setForm((p) => ({ ...p, thumbnailUrl: v }))}
            />
            <AdminFormField
              label="SEO 제목"
              value={form.seoTitle}
              onChangeText={(v) => setForm((p) => ({ ...p, seoTitle: v }))}
            />
            <AdminFormField
              label="SEO 설명"
              value={form.seoDescription}
              onChangeText={(v) => setForm((p) => ({ ...p, seoDescription: v }))}
              multiline
            />

            <View className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
              <Text className="text-sm font-semibold text-slate-700">공개 (웹·앱 노출)</Text>
              <Switch
                value={form.isPublished}
                onValueChange={(v) => setForm((p) => ({ ...p, isPublished: v }))}
              />
            </View>

            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-xl bg-slate-200 py-3"
                onPress={() => setFormVisible(false)}
              >
                <Text className="font-bold text-slate-700">취소</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl bg-emerald-700 py-3"
                onPress={() => void handleSave()}
                disabled={submitting}
              >
                <Text className="font-bold text-white">{submitting ? '저장 중...' : '저장'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <AdminConfirmModal
        visible={deleteTarget !== null}
        title="블로그 글 삭제"
        message={`"${deleteTarget?.title ?? ''}" 글을 삭제할까요?`}
        confirmLabel="삭제"
        destructive
        loading={submitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </View>
  );
}
