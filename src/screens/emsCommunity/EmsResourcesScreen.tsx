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
  View,
} from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  LoungeBody,
  LoungeCard,
  LoungeErrorBanner,
  LoungeMetaText,
  LoungePrimaryButton,
  LoungeScreen,
  LoungeTag,
  LoungeTitle,
  LoungeWriteBar,
  loungeListContent,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { RESOURCE_CATEGORIES } from '@/constants/emsCommunity';
import { EMS_LOUNGE, EMS_LOUNGE_SPACING } from '@/constants/emsLoungeTheme';
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
    <LoungeCard>
      <Pressable onPress={() => void openExternalUrl(doc.url, doc.title)} className="active:opacity-95">
        <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <LoungeTag label={doc.category} />
          <View className="mt-3">
            <LoungeTitle numberOfLines={2}>{doc.title}</LoungeTitle>
          </View>
          <View className="mt-2">
            <LoungeBody numberOfLines={2}>{doc.description}</LoungeBody>
          </View>
          <View className="mt-3">
            <LoungeMetaText>{`업데이트 ${doc.updatedAt}`}</LoungeMetaText>
          </View>
        </View>
        <Ionicons name="open-outline" size={20} color={EMS_LOUNGE.textMuted} />
      </View>
      {doc.isExternal ? (
        <Text
          style={{
            marginTop: 10,
            fontFamily: 'Pretendard',
            fontSize: 11,
            color: EMS_LOUNGE.amberText,
          }}
        >
          외부 웹에서 열림 · 앱 내 결제/모금 없음
        </Text>
      ) : null}
      </Pressable>
      {canManage ? (
        <View className="mt-4 flex-row gap-2">
          <Pressable
            className="rounded-lg px-3 py-1.5 active:opacity-80"
            style={{ backgroundColor: EMS_LOUNGE.borderLight }}
            onPress={() => onEdit(doc)}
          >
            <Text
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 11,
                color: EMS_LOUNGE.textSecondary,
              }}
            >
              수정
            </Text>
          </Pressable>
          <Pressable
            className="rounded-lg px-3 py-1.5 active:opacity-80"
            style={{ backgroundColor: EMS_LOUNGE.errorBg }}
            onPress={() => onDelete(doc)}
          >
            <Text
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 11,
                color: EMS_LOUNGE.error,
              }}
            >
              삭제
            </Text>
          </Pressable>
        </View>
      ) : null}
    </LoungeCard>
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
    <LoungeScreen>
      <ParamedicHeader />

      {canManageResources ? (
        <LoungeWriteBar label="자료 추가" onPress={openCreateForm} icon="add-outline" />
      ) : null}

      {error ? <LoungeErrorBanner message={error} /> : null}

      {loading && resourceDocuments.length === 0 ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator color={EMS_LOUNGE.navy} />
        </View>
      ) : (
        <FlatList
          data={resourceDocuments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={loungeListContent}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text
                style={{
                  fontFamily: 'Pretendard',
                  fontSize: 14,
                  color: EMS_LOUNGE.textSecondary,
                }}
              >
                등록된 자료가 없습니다.
              </Text>
              {canManageResources ? (
                <Text
                  style={{
                    marginTop: 4,
                    fontFamily: 'Pretendard',
                    fontSize: 12,
                    color: EMS_LOUNGE.textMuted,
                  }}
                >
                  상단의 자료 추가 버튼으로 등록해 주세요.
                </Text>
              ) : null}
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
          className="flex-1"
          style={{ backgroundColor: EMS_LOUNGE.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text
              style={{
                marginBottom: 16,
                fontFamily: 'Pretendard-Bold',
                fontSize: 18,
                color: EMS_LOUNGE.navy,
              }}
            >
              {editingId ? '자료 수정' : '자료 추가'}
            </Text>
            <AdminFormField
              label="제목"
              value={form.title}
              onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
              placeholder="자료 제목"
            />
            <Text
              style={{
                marginBottom: 4,
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 12,
                color: EMS_LOUNGE.textSecondary,
              }}
            >
              분류
            </Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {RESOURCE_CATEGORIES.map((category) => (
                <LoungeTag
                  key={category}
                  label={category}
                  active={form.category === category}
                  onPress={() => setForm((prev) => ({ ...prev, category }))}
                />
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
            <View
              className="mb-4 flex-row items-center justify-between"
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: EMS_LOUNGE.border,
                backgroundColor: EMS_LOUNGE.surface,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <View className="flex-1 pr-3">
                <Text
                  style={{
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: 14,
                    color: EMS_LOUNGE.text,
                  }}
                >
                  외부 링크
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontFamily: 'Pretendard',
                    fontSize: 12,
                    color: EMS_LOUNGE.textMuted,
                  }}
                >
                  외부 웹에서 열리는 자료로 표시
                </Text>
              </View>
              <Switch
                value={form.isExternal}
                onValueChange={(value) => setForm((prev) => ({ ...prev, isExternal: value }))}
              />
            </View>
            <LoungePrimaryButton
              label={submitting ? '저장 중...' : '저장'}
              onPress={() => void handleSave()}
            />
            <Pressable className="mt-3 items-center py-2" onPress={() => setFormVisible(false)}>
              <Text
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 14,
                  color: EMS_LOUNGE.textMuted,
                }}
              >
                취소
              </Text>
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
    </LoungeScreen>
  );
}
