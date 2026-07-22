import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { MIRAE_EXTERNAL_LINKS, RESOURCE_CATEGORIES } from '@/constants/emsCommunity';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import type { ResourceDocument } from '@/data/paramedicMockData';
import { useExpertSettingsAccess } from '@/hooks/useExpertSettingsAccess';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';

async function openExternalUrl(url: string, label: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('연결 불가', `${label} 링크를 열 수 없습니다.`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('연결 실패', '외부 브라우저에서 다시 시도해 주세요.');
  }
}

const EMPTY_FORM = {
  title: '',
  category: RESOURCE_CATEGORIES[0],
  description: '',
  url: '',
  isExternal: false,
};

function ResourceCard({
  doc,
  canManage,
  onEdit,
  onDelete,
}: {
  doc: ResourceDocument;
  canManage: boolean;
  onEdit: (doc: ResourceDocument) => void;
  onDelete: (doc: ResourceDocument) => void;
}) {
  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
      <Pressable onPress={() => void openExternalUrl(doc.url, doc.title)}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <View className="self-start rounded-full bg-blue-50 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-blue-700">{doc.category}</Text>
            </View>
            <Text className="mt-2 text-base font-bold text-slate-900">{doc.title}</Text>
            <Text className="mt-1 text-sm text-slate-600">{doc.description}</Text>
            <Text className="mt-2 text-xs text-slate-400">업데이트 {doc.updatedAt}</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="#64748b" />
        </View>
        {doc.isExternal ? (
          <Text className="mt-2 text-xs text-amber-700">외부 웹에서 열림 · 앱 내 결제/모금 없음</Text>
        ) : null}
      </Pressable>
      {canManage ? (
        <View className="mt-3 flex-row gap-2 border-t border-slate-100 pt-3">
          <Pressable
            className="rounded-lg bg-slate-100 px-3 py-1.5"
            onPress={() => onEdit(doc)}
          >
            <Text className="text-[11px] font-bold text-slate-700">수정</Text>
          </Pressable>
          <Pressable
            className="rounded-lg bg-red-100 px-3 py-1.5"
            onPress={() => onDelete(doc)}
          >
            <Text className="text-[11px] font-bold text-red-700">삭제</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function EmsResourcesScreen() {
  const { resourceDocuments, loading, error, upsertResourceDocument, deleteResourceDocument } =
    useParamedicCommunity();
  const { isDbAdmin, opsAdminVerified } = useExpertSettingsAccess();
  const canManageResources = isDbAdmin || opsAdminVerified;

  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResourceDocument | null>(null);

  useHardwareBackHandler(() => {
    if (formVisible) {
      setFormVisible(false);
      return true;
    }
    return false;
  }, formVisible);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormVisible(true);
  };

  const openEditForm = (doc: ResourceDocument) => {
    setEditingId(doc.id);
    setForm({
      title: doc.title,
      category: doc.category,
      description: doc.description,
      url: doc.url,
      isExternal: doc.isExternal ?? false,
    });
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (form.title.trim().length < 2) {
      Alert.alert('입력 부족', '제목을 2자 이상 입력해 주세요.');
      return;
    }
    if (!form.url.trim().startsWith('http')) {
      Alert.alert('URL 확인', 'http 또는 https로 시작하는 URL을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await upsertResourceDocument({
        id: editingId ?? undefined,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        url: form.url.trim(),
        isExternal: form.isExternal,
      });
      setFormVisible(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      Alert.alert('완료', editingId ? '자료가 수정되었습니다.' : '자료가 등록되었습니다.');
    } catch (err) {
      Alert.alert('저장 실패', err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await deleteResourceDocument(deleteTarget.id);
      setDeleteTarget(null);
      Alert.alert('완료', '자료가 삭제되었습니다.');
    } catch (err) {
      Alert.alert('삭제 실패', err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-100">
      <ParamedicHeader subtitle="자료실 · 프로토콜 · 학술회" />

      <View className="border-b border-slate-200 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-bold text-slate-900">학술회 · 가이드라인 · 교육 자료</Text>
            <Text className="mt-1 text-xs text-slate-500">
              PDF·공지는 외부 웹 또는 브라우저에서 열람합니다.
            </Text>
          </View>
          {canManageResources ? (
            <Pressable className="rounded-xl bg-blue-700 px-4 py-2" onPress={openCreateForm}>
              <Text className="text-xs font-bold text-white">자료 추가</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? (
        <View className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      ) : null}

      {loading && resourceDocuments.length === 0 ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator color="#1d4ed8" />
        </View>
      ) : (
        <FlatList
          data={resourceDocuments}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-6"
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-sm text-slate-500">등록된 자료가 없습니다.</Text>
              {canManageResources ? (
                <Text className="mt-1 text-xs text-slate-400">상단의 자료 추가 버튼으로 등록해 주세요.</Text>
              ) : null}
            </View>
          }
          ListFooterComponent={
            <View className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Text className="text-sm font-bold text-amber-900">미래회 외부 안내 (앱 내 결제 없음)</Text>
              <Text className="mt-2 text-xs leading-5 text-amber-800">
                모금·공동구매·후원은 앱에서 처리하지 않습니다. 아래 버튼으로 공식 웹사이트에서만
                진행해 주세요.
              </Text>
              <View className="mt-3 gap-2">
                <Pressable
                  className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3"
                  onPress={() => void openExternalUrl(MIRAE_EXTERNAL_LINKS.officialSite, '미래회 공식')}
                >
                  <Text className="text-sm font-semibold text-slate-800">미래회 공식 홈페이지</Text>
                  <Ionicons name="globe-outline" size={18} color="#64748b" />
                </Pressable>
                <Pressable
                  className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3"
                  onPress={() => void openExternalUrl(MIRAE_EXTERNAL_LINKS.groupBuy, '공동구매')}
                >
                  <Text className="text-sm font-semibold text-slate-800">공동구매 안내 (외부)</Text>
                  <Ionicons name="open-outline" size={18} color="#64748b" />
                </Pressable>
                <Pressable
                  className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3"
                  onPress={() => void openExternalUrl(MIRAE_EXTERNAL_LINKS.donation, '후원')}
                >
                  <Text className="text-sm font-semibold text-slate-800">후원·모금 안내 (외부)</Text>
                  <Ionicons name="open-outline" size={18} color="#64748b" />
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <ResourceCard
              doc={item}
              canManage={canManageResources}
              onEdit={openEditForm}
              onDelete={setDeleteTarget}
            />
          )}
        />
      )}

      <Modal visible={formVisible} animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView
          className="flex-1 bg-slate-50"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerClassName="p-4 pb-10">
            <Text className="mb-4 text-lg font-bold text-slate-900">
              {editingId ? '자료 수정' : '자료 추가'}
            </Text>
            <AdminFormField
              label="제목"
              value={form.title}
              onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
              placeholder="자료 제목"
            />
            <Text className="mb-1 text-xs font-semibold text-slate-600">분류</Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {RESOURCE_CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setForm((prev) => ({ ...prev, category }))}
                  className={`rounded-full px-3 py-1.5 ${
                    form.category === category ? 'bg-blue-700' : 'bg-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      form.category === category ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
            <AdminFormField
              label="설명"
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder="한 줄 설명"
              multiline
            />
            <AdminFormField
              label="URL"
              value={form.url}
              onChangeText={(value) => setForm((prev) => ({ ...prev, url: value }))}
              placeholder="https://..."
            />
            <View className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-semibold text-slate-800">외부 링크</Text>
                <Text className="mt-0.5 text-xs text-slate-500">외부 웹에서 열리는 자료로 표시</Text>
              </View>
              <Switch
                value={form.isExternal}
                onValueChange={(value) => setForm((prev) => ({ ...prev, isExternal: value }))}
              />
            </View>
            <Pressable
              className={`items-center rounded-xl py-3 ${submitting ? 'bg-blue-300' : 'bg-blue-700'}`}
              disabled={submitting}
              onPress={() => void handleSave()}
            >
              <Text className="font-bold text-white">{submitting ? '저장 중...' : '저장'}</Text>
            </Pressable>
            <Pressable className="mt-3 items-center py-2" onPress={() => setFormVisible(false)}>
              <Text className="font-semibold text-slate-500">취소</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <AdminConfirmModal
        visible={!!deleteTarget}
        title="자료 삭제"
        message={`"${deleteTarget?.title}" 자료를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={submitting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
