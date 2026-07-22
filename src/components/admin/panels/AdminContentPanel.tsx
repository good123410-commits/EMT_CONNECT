import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  adminDeleteJobPost,
  adminListJobPosts,
  adminUpsertJobPost,
  AdminServiceError,
} from '@/services/adminService';
import {
  createEmergencyGuide,
  deleteEmergencyGuide,
  fetchEmergencyGuides,
  type EmergencyGuide,
} from '@/services/guideService';
import type { AdminJobPost } from '@/types/admin';

type ContentSection = 'guides' | 'jobs';

const EMPTY_JOB_FORM: {
  postType: 'hire' | 'seek';
  title: string;
  company: string;
  location: string;
  salary: string;
  schedule: string;
  requirements: string;
  content: string;
  isUrgent: boolean;
  isPublished: boolean;
} = {
  postType: 'hire',
  title: '',
  company: '',
  location: '',
  salary: '',
  schedule: '',
  requirements: '',
  content: '',
  isUrgent: false,
  isPublished: true,
};

export function AdminContentPanel() {
  const [section, setSection] = useState<ContentSection>('guides');
  const [guides, setGuides] = useState<EmergencyGuide[]>([]);
  const [jobs, setJobs] = useState<AdminJobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [guideFormVisible, setGuideFormVisible] = useState(false);
  const [jobFormVisible, setJobFormVisible] = useState(false);
  const [guideTitle, setGuideTitle] = useState('');
  const [guideCategory, setGuideCategory] = useState('기타');
  const [guideContent, setGuideContent] = useState('');
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [deleteJobTarget, setDeleteJobTarget] = useState<AdminJobPost | null>(null);
  const [deleteGuideTarget, setDeleteGuideTarget] = useState<EmergencyGuide | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [guideRows, jobRows] = await Promise.all([
        fetchEmergencyGuides(),
        adminListJobPosts().catch(() => [] as AdminJobPost[]),
      ]);
      setGuides(guideRows);
      setJobs(jobRows);
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
      await createEmergencyGuide({
        title: guideTitle.trim(),
        category: guideCategory.trim() || '기타',
        content: guideContent.trim(),
        severity: 'moderate',
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

  const handleSaveJob = async () => {
    if (!jobForm.title.trim()) {
      Alert.alert('입력 필요', '제목을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await adminUpsertJobPost({
        id: editingJobId ?? undefined,
        postType: jobForm.postType,
        title: jobForm.title,
        company: jobForm.company,
        location: jobForm.location,
        salary: jobForm.salary,
        schedule: jobForm.schedule,
        requirements: jobForm.requirements,
        content: jobForm.content,
        isUrgent: jobForm.isUrgent,
        isPublished: jobForm.isPublished,
      });
      setJobFormVisible(false);
      setEditingJobId(null);
      setJobForm(EMPTY_JOB_FORM);
      await reload();
      Alert.alert('완료', editingJobId ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.');
    } catch (error) {
      Alert.alert('실패', error instanceof AdminServiceError ? error.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditJob = (job: AdminJobPost) => {
    setEditingJobId(job.id);
    setJobForm({
      postType: job.post_type,
      title: job.title,
      company: job.company ?? '',
      location: job.location ?? '',
      salary: job.salary ?? '',
      schedule: job.schedule ?? '',
      requirements: job.requirements ?? '',
      content: job.content ?? '',
      isUrgent: job.is_urgent,
      isPublished: job.is_published,
    });
    setJobFormVisible(true);
  };

  const handleDeleteJob = async () => {
    if (!deleteJobTarget) return;
    setSubmitting(true);
    try {
      await adminDeleteJobPost(deleteJobTarget.id);
      setDeleteJobTarget(null);
      await reload();
      Alert.alert('완료', '게시글이 삭제되었습니다.');
    } catch (error) {
      Alert.alert('실패', error instanceof AdminServiceError ? error.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGuide = async () => {
    if (!deleteGuideTarget) return;
    setSubmitting(true);
    try {
      await deleteEmergencyGuide(deleteGuideTarget.id);
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
      <SegmentControl
        options={[
          { value: 'guides', label: '응급처치' },
          { value: 'jobs', label: '구인/구직' },
        ]}
        value={section}
        onChange={setSection}
      />

      <Pressable
        className="mt-3 items-center rounded-xl bg-violet-700 py-3"
        onPress={() => {
          if (section === 'guides') {
            setGuideFormVisible(true);
          } else {
            setEditingJobId(null);
            setJobForm(EMPTY_JOB_FORM);
            setJobFormVisible(true);
          }
        }}
      >
        <Text className="font-bold text-white">
          {section === 'guides' ? '+ 응급처치 가이드 추가' : '+ 구인/구직 게시글 추가'}
        </Text>
      </Pressable>

      {section === 'guides' ? (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          className="mt-3"
          contentContainerClassName="pb-6"
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-slate-500">등록된 가이드가 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="font-semibold text-slate-900">{item.title}</Text>
              <Text className="mt-0.5 text-xs text-slate-500">{item.category}</Text>
              <Pressable className="mt-2 self-start rounded-lg bg-red-100 px-2.5 py-1" onPress={() => setDeleteGuideTarget(item)}>
                <Text className="text-[11px] font-bold text-red-700">삭제</Text>
              </Pressable>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          className="mt-3"
          contentContainerClassName="pb-6"
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-slate-500">등록된 게시글이 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
              <View className="flex-row items-center gap-2">
                <Text className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {item.post_type === 'hire' ? '구인' : '구직'}
                </Text>
                {!item.is_published ? (
                  <Text className="text-[10px] text-amber-600">비공개</Text>
                ) : null}
              </View>
              <Text className="mt-1 font-semibold text-slate-900">{item.title}</Text>
              <Text className="text-xs text-slate-500">{item.company ?? item.location ?? '—'}</Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable className="rounded-lg bg-slate-100 px-2.5 py-1" onPress={() => openEditJob(item)}>
                  <Text className="text-[11px] font-bold text-slate-700">수정</Text>
                </Pressable>
                <Pressable className="rounded-lg bg-red-100 px-2.5 py-1" onPress={() => setDeleteJobTarget(item)}>
                  <Text className="text-[11px] font-bold text-red-700">삭제</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={guideFormVisible} animationType="slide" onRequestClose={() => setGuideFormVisible(false)}>
        <View className="flex-1 bg-slate-50">
          <ScrollView contentContainerClassName="p-4 pb-10">
            <Text className="mb-4 text-lg font-bold text-slate-900">응급처치 가이드 추가</Text>
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
              <Text className="font-semibold text-slate-500">취소</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={jobFormVisible} animationType="slide" onRequestClose={() => setJobFormVisible(false)}>
        <View className="flex-1 bg-slate-50">
          <ScrollView contentContainerClassName="p-4 pb-10">
            <Text className="mb-4 text-lg font-bold text-slate-900">
              {editingJobId ? '구인/구직 수정' : '구인/구직 추가'}
            </Text>
            <SegmentControl
              options={[
                { value: 'hire', label: '구인' },
                { value: 'seek', label: '구직' },
              ]}
              value={jobForm.postType}
              onChange={(value) => setJobForm((prev) => ({ ...prev, postType: value }))}
            />
            <View className="mt-3">
              <AdminFormField label="제목" value={jobForm.title} onChangeText={(v) => setJobForm((p) => ({ ...p, title: v }))} />
              <AdminFormField label="기관/회사" value={jobForm.company} onChangeText={(v) => setJobForm((p) => ({ ...p, company: v }))} />
              <AdminFormField label="지역" value={jobForm.location} onChangeText={(v) => setJobForm((p) => ({ ...p, location: v }))} />
              <AdminFormField label="급여" value={jobForm.salary} onChangeText={(v) => setJobForm((p) => ({ ...p, salary: v }))} />
              <AdminFormField label="근무형태" value={jobForm.schedule} onChangeText={(v) => setJobForm((p) => ({ ...p, schedule: v }))} />
              <AdminFormField label="자격요건" value={jobForm.requirements} onChangeText={(v) => setJobForm((p) => ({ ...p, requirements: v }))} multiline />
              <AdminFormField label="상세내용" value={jobForm.content} onChangeText={(v) => setJobForm((p) => ({ ...p, content: v }))} multiline />
            </View>
            <Pressable
              className={`items-center rounded-xl py-3 ${submitting ? 'bg-violet-300' : 'bg-violet-700'}`}
              disabled={submitting}
              onPress={() => void handleSaveJob()}
            >
              <Text className="font-bold text-white">{submitting ? '저장 중...' : '저장'}</Text>
            </Pressable>
            <Pressable className="mt-3 items-center py-2" onPress={() => setJobFormVisible(false)}>
              <Text className="font-semibold text-slate-500">취소</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <AdminConfirmModal
        visible={!!deleteJobTarget}
        title="게시글 삭제"
        message={`"${deleteJobTarget?.title}" 게시글을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={submitting}
        onConfirm={() => void handleDeleteJob()}
        onCancel={() => setDeleteJobTarget(null)}
      />
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
