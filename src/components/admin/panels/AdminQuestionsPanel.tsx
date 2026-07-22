import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  adminDeleteQuestion,
  adminListQuestions,
  adminUpdateQuestion,
  submitParamedicAnswer,
  type AdminQuestionRow,
} from '@/services/questionService';
import type { QuestionStatus } from '@/lib/supabaseClient';

type QuestionFilter = 'all' | QuestionStatus;

const FILTER_OPTIONS: Array<{ value: QuestionFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '답변 대기' },
  { value: 'answered', label: '답변 완료' },
];

const STATUS_LABEL: Record<QuestionStatus, string> = {
  pending: '답변 대기',
  answered: '답변 완료',
};

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function AdminQuestionsPanel() {
  const [filter, setFilter] = useState<QuestionFilter>('all');
  const [rows, setRows] = useState<AdminQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<AdminQuestionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminQuestionRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<QuestionStatus>('pending');
  const [adminAnswer, setAdminAnswer] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListQuestions(filter);
      setRows(data);
    } catch (error) {
      showAlert('조회 실패', error instanceof Error ? error.message : '질문 목록을 불러올 수 없습니다.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openEdit = (row: AdminQuestionRow) => {
    setEditTarget(row);
    setFormTitle(row.title);
    setFormContent(row.content);
    setFormStatus(row.status);
    setAdminAnswer(row.answer?.content ?? '');
  };

  const handleSave = async () => {
    if (!editTarget) return;
    if (!formTitle.trim() || !formContent.trim()) {
      showAlert('입력 필요', '제목과 내용을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await adminUpdateQuestion(editTarget.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        status: formStatus,
      });

      const trimmedAnswer = adminAnswer.trim();
      if (trimmedAnswer.length >= 5 && editTarget.status === 'pending') {
        await submitParamedicAnswer(editTarget.id, trimmedAnswer);
      }

      setEditTarget(null);
      await reload();
      showAlert('완료', '질문이 저장되었습니다.');
    } catch (error) {
      showAlert('저장 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await adminDeleteQuestion(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
      showAlert('완료', '질문이 삭제되었습니다.');
    } catch (error) {
      showAlert('삭제 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text className="mb-2 text-sm text-slate-600">
        일반 사용자가 올린 Q&A 질문을 검토·수정·삭제합니다. 답변 대기 건은 관리자 답변을 등록할 수 있습니다.
      </Text>

      <SegmentControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#5b21b6" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-slate-500">표시할 질문이 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-violet-700">{STATUS_LABEL[item.status]}</Text>
                  <Text className="mt-1 text-base font-bold text-slate-900">{item.title}</Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString('ko-KR')}
                  </Text>
                  <Text className="mt-2 text-sm leading-5 text-slate-700" numberOfLines={3}>
                    {item.content}
                  </Text>
                  {item.answer ? (
                    <Text className="mt-2 text-xs leading-5 text-green-800" numberOfLines={2}>
                      답변: {item.answer.content}
                    </Text>
                  ) : null}
                </View>
                <View className="flex-row gap-1">
                  <Pressable className="rounded-lg bg-slate-100 p-2" onPress={() => openEdit(item)}>
                    <Ionicons name="create-outline" size={16} color="#475569" />
                  </Pressable>
                  <Pressable className="rounded-lg bg-red-50 p-2" onPress={() => setDeleteTarget(item)}>
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={Boolean(editTarget)} animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <ScrollView className="flex-1 bg-white" contentContainerClassName="p-4 pb-10">
          <Text className="mb-4 text-lg font-bold text-slate-900">질문 수정</Text>
          <AdminFormField label="제목" value={formTitle} onChangeText={setFormTitle} />
          <AdminFormField label="내용" value={formContent} onChangeText={setFormContent} multiline />
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-slate-700">상태</Text>
            <SegmentControl
              options={[
                { value: 'pending', label: '답변 대기' },
                { value: 'answered', label: '답변 완료' },
              ]}
              value={formStatus}
              onChange={setFormStatus}
            />
          </View>
          {editTarget?.status === 'pending' || formStatus === 'pending' ? (
            <AdminFormField
              label="관리자 답변 (5자 이상, 저장 시 등록)"
              value={adminAnswer}
              onChangeText={setAdminAnswer}
              multiline
            />
          ) : null}
          <Pressable
            className={`items-center rounded-xl py-3 ${submitting ? 'bg-violet-300' : 'bg-violet-700'}`}
            disabled={submitting}
            onPress={() => void handleSave()}
          >
            <Text className="font-bold text-white">{submitting ? '저장 중...' : '저장'}</Text>
          </Pressable>
          <Pressable className="mt-3 items-center py-2" onPress={() => setEditTarget(null)}>
            <Text className="font-semibold text-slate-500">취소</Text>
          </Pressable>
        </ScrollView>
      </Modal>

      <AdminConfirmModal
        visible={Boolean(deleteTarget)}
        title="질문 삭제"
        message="이 질문과 연결된 답변을 함께 삭제할까요?"
        confirmLabel="삭제"
        destructive
        loading={submitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </View>
  );
}
