import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { CommunityAuthorActions } from '@/components/emsCommunity/CommunityAuthorActions';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { CommunityListPagination } from '@/components/emsCommunity/CommunityListPagination';
import { CommunityBestSection } from '@/components/emsCommunity/CommunityBestSection';
import { CommunityCommentSection } from '@/components/emsCommunity/CommunityCommentSection';
import { CommunityListScrollHeader } from '@/components/emsCommunity/CommunityListScrollHeader';
import { CommunityPostDetailLayout } from '@/components/emsCommunity/CommunityPostDetailLayout';
import { RichContentRenderer } from '@/components/content/RichContentRenderer';
import {
  LoungeActionRow,
  LoungeCard,
  LoungeFab,
  LoungeInput,
  LoungeMetaText,
  LoungePrimaryButton,
  LoungeScreen,
  LoungeTitle,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import type { JobPost } from '@/data/paramedicMockData';
import { useCommunityListScrollToTop } from '@/hooks/useCommunityListScrollToTop';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { usePaginatedEmsPosts } from '@/hooks/usePaginatedEmsPosts';
import { mapRowToJobPost } from '@/services/emsCommunityService';
import {
  deleteCommunityPostByAuthor,
  updateCommunityPostByAuthor,
} from '@/services/communityAuthorService';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';
import { isPostAuthor } from '@/utils/communityPostAccess';

type JobWriteMode = 'choose' | 'seek' | 'hire';

function JobTypeBadge({ post }: { post: JobPost }) {
  const { lounge } = useEmsLoungeTheme();
  const isSeek = post.type === 'seek';
  const bg = isSeek ? lounge.accentMuted : post.isUrgent ? lounge.errorBg : lounge.greenSoft;
  const color = isSeek ? lounge.accentSoft : post.isUrgent ? lounge.error : lounge.green;
  const label = isSeek ? '구직' : post.isUrgent ? '긴급채용' : '구인';

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
      <Text style={{ fontFamily: 'Pretendard-Bold', fontSize: 10, color }}>{label}</Text>
    </View>
  );
}

function JobCard({ post, onPress }: { post: JobPost; onPress: () => void }) {
  const { lounge } = useEmsLoungeTheme();
  return (
    <LoungeCard onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <JobTypeBadge post={post} />
            <LoungeMetaText>{post.postedAt}</LoungeMetaText>
          </View>
          <View className="mt-3">
            <LoungeTitle numberOfLines={1}>{post.title}</LoungeTitle>
          </View>
          <Text
            style={{
              marginTop: 4,
              fontFamily: 'Pretendard-Medium',
              fontSize: 13,
              color: lounge.textSecondary,
            }}
          >
            {post.company}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={lounge.textMuted} />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={13} color={lounge.textMuted} />
          <Text
            style={{
              marginLeft: 4,
              fontFamily: 'Pretendard',
              fontSize: 11,
              color: lounge.textSecondary,
            }}
          >
            {post.location}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={13} color={lounge.textMuted} />
          <Text
            style={{
              marginLeft: 4,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 11,
              color: lounge.green,
            }}
          >
            {post.salary}
          </Text>
        </View>
      </View>

      <LoungeActionRow
        right={
          <ReportContentButton contentId={post.id} contentType="job" preview={post.title} compact />
        }
      />
    </LoungeCard>
  );
}

function FieldLabel({ children }: { children: string }) {
  const { lounge } = useEmsLoungeTheme();
  return (
    <Text
      style={{
        marginBottom: 4,
        fontFamily: 'Pretendard-SemiBold',
        fontSize: 12,
        color: lounge.textMuted,
      }}
    >
      {children}
    </Text>
  );
}

export function ParamedicJobsScreen() {
  const { lounge } = useEmsLoungeTheme();
  const loungeListContentStyle = useLoungeListContentStyle(12, true);
  const { user } = useAuth();
  const { postJobSeek, postJobHire, error: feedError, reload } = useParamedicCommunity();
  const {
    items: jobPosts,
    bestItems,
    currentPage,
    totalCount,
    hasMultiplePages,
    loading,
    error: listError,
    goToPage,
    refresh: refreshList,
  } = usePaginatedEmsPosts({
    postTypes: ['job_seek', 'job_hire'],
    mapRow: mapRowToJobPost,
    enableBest: true,
  });
  const error = listError ?? feedError;
  const { listRef, scrollToTop } = useCommunityListScrollToTop<JobPost>();

  const handlePageChange = useCallback(
    (page: number) => {
      void goToPage(page);
      scrollToTop();
    },
    [goToPage, scrollToTop],
  );
  const [selected, setSelected] = useState<JobPost | null>(null);
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [writeMode, setWriteMode] = useState<JobWriteMode | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [company, setCompany] = useState('');
  const [salary, setSalary] = useState('');
  const [schedule, setSchedule] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openWriteChooser = useCallback(() => {
    setEditingJob(null);
    setWriteMode('choose');
  }, []);

  const closeWriteModal = () => {
    setWriteMode(null);
    setEditingJob(null);
    setTitle('');
    setLocation('');
    setContent('');
    setCompany('');
    setSalary('');
    setSchedule('');
    setIsUrgent(false);
    setSubmitting(false);
  };

  useHardwareBackHandler(() => {
    if (selected) {
      setSelected(null);
      return true;
    }
    if (writeMode) {
      if (writeMode === 'choose' || editingJob) {
        closeWriteModal();
      } else {
        setWriteMode('choose');
      }
      return true;
    }
    return false;
  }, Boolean(writeMode || selected));

  const handleSubmitSeek = async () => {
    if (submitting) return;
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 필요', '제목과 내용을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingJob) {
        const updated = await updateCommunityPostByAuthor(editingJob.id, {
          title: title.trim(),
          content: content.trim(),
          jobLocation: location.trim() || '전국',
        });
        const mapped = mapRowToJobPost(updated);
        if (selected?.id === editingJob.id) {
          setSelected(mapped);
        }
      } else {
        await postJobSeek(title.trim(), content.trim(), location.trim() || '전국');
      }
      await reload();
      await refreshList();
      closeWriteModal();
      Alert.alert('완료', editingJob ? '구직 글이 수정되었습니다.' : '구직 글이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        editingJob ? '수정 실패' : '등록 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitHire = async () => {
    if (submitting) return;
    if (!title.trim() || !company.trim() || !content.trim()) {
      Alert.alert('입력 필요', '제목, 기관명, 채용 내용을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingJob) {
        const updated = await updateCommunityPostByAuthor(editingJob.id, {
          title: title.trim(),
          content: content.trim(),
          companyName: company.trim(),
          jobLocation: location.trim() || '미정',
          salary: salary.trim() || '협의',
          schedule: schedule.trim() || '협의',
          isUrgent,
        });
        const mapped = mapRowToJobPost(updated);
        if (selected?.id === editingJob.id) {
          setSelected(mapped);
        }
      } else {
        await postJobHire({
          title: title.trim(),
          company: company.trim(),
          location: location.trim() || '미정',
          salary: salary.trim() || '협의',
          schedule: schedule.trim() || '협의',
          requirements: content.trim(),
          isUrgent,
        });
      }
      await reload();
      await refreshList();
      closeWriteModal();
      Alert.alert('완료', editingJob ? '구인 글이 수정되었습니다.' : '구인 글이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        editingJob ? '수정 실패' : '등록 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditJob = () => {
    if (!selected) return;
    setEditingJob(selected);
    setTitle(selected.title);
    setLocation(selected.location);
    setContent(selected.requirements);
    setCompany(selected.company);
    setSalary(selected.salary);
    setSchedule(selected.schedule);
    setIsUrgent(Boolean(selected.isUrgent));
    setWriteMode(selected.type);
  };

  const handleDeleteJob = () => {
    if (!selected) return;
    confirmDestructiveAction(
      '공고 삭제',
      '삭제된 공고는 복구할 수 없습니다. 계속하시겠습니까?',
      async () => {
        await deleteCommunityPostByAuthor(selected.id);
        setSelected(null);
        await reload();
        await refreshList();
      },
    );
  };

  const isSelectedAuthor = isPostAuthor(selected?.authorId, user?.id);

  const modalTitle =
    editingJob && writeMode === 'hire'
      ? '구인 글 수정'
      : editingJob && writeMode === 'seek'
        ? '구직 글 수정'
        : writeMode === 'hire'
          ? '구인 글쓰기'
          : writeMode === 'seek'
            ? '구직 글쓰기'
            : '글 유형 선택';

  const writeModal = (
    <Modal visible={writeMode !== null} animationType="slide" transparent>
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="flex-1 bg-black/40" onPress={closeWriteModal} />
        <View
          className="max-h-[85%] px-4 pb-8 pt-4"
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: lounge.surface,
          }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text style={{ fontFamily: 'Pretendard-Bold', fontSize: 18, color: lounge.text }}>
              {modalTitle}
            </Text>
            <Pressable onPress={closeWriteModal}>
              <Ionicons name="close" size={24} color={lounge.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {writeMode === 'choose' ? (
              <View className="gap-3">
                <LoungePrimaryButton label="구인 글쓰기" onPress={() => setWriteMode('hire')} />
                <LoungePrimaryButton label="구직 글쓰기" onPress={() => setWriteMode('seek')} />
              </View>
            ) : writeMode === 'seek' ? (
              <>
                <FieldLabel>제목</FieldLabel>
                <LoungeInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="예: 119 경력 5년 · 야간 근무 희망"
                />
                <FieldLabel>희망 지역</FieldLabel>
                <LoungeInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="예: 서울, 경기"
                />
                <FieldLabel>이력 · 자기소개</FieldLabel>
                <LoungeInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="면허, 경력, 희망 근무 조건 등을 작성해 주세요"
                  multiline
                  minHeight={120}
                />
                <LoungePrimaryButton
                  label={submitting ? '저장 중…' : editingJob ? '수정 저장' : '구직 글 등록'}
                  disabled={submitting}
                  onPress={() => void handleSubmitSeek()}
                />
              </>
            ) : (
              <>
                <FieldLabel>채용 제목</FieldLabel>
                <LoungeInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="예: 119 구급대원 채용 (정규직)"
                />
                <FieldLabel>기관명</FieldLabel>
                <LoungeInput
                  value={company}
                  onChangeText={setCompany}
                  placeholder="예: ○○소방서"
                />
                <FieldLabel>근무 지역</FieldLabel>
                <LoungeInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="예: 서울 강남구"
                />
                <FieldLabel>급여</FieldLabel>
                <LoungeInput value={salary} onChangeText={setSalary} placeholder="예: 연봉 4,000만원" />
                <FieldLabel>근무 형태</FieldLabel>
                <LoungeInput value={schedule} onChangeText={setSchedule} placeholder="예: 3교대, 주 5일" />
                <FieldLabel>채용 내용 · 자격 요건</FieldLabel>
                <LoungeInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="담당 업무, 자격 요건, 지원 방법 등"
                  multiline
                  minHeight={120}
                />
                <View className="mb-3 flex-row items-center justify-between">
                  <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 14, color: lounge.text }}>
                    긴급 채용
                  </Text>
                  <Switch
                    value={isUrgent}
                    onValueChange={setIsUrgent}
                    trackColor={{ false: lounge.border, true: lounge.accentMuted }}
                    thumbColor={isUrgent ? lounge.accent : lounge.textMuted}
                  />
                </View>
                <LoungePrimaryButton
                  label={submitting ? '저장 중…' : editingJob ? '수정 저장' : '구인 글 등록'}
                  disabled={submitting}
                  onPress={() => void handleSubmitHire()}
                />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (selected) {
    return (
      <LoungeScreen>
        <ParamedicHeader />
        <CommunityPostDetailLayout backLabel="목록" onBack={() => setSelected(null)}>
          <LoungeCard>
            <View className="flex-row items-center gap-2">
              <JobTypeBadge post={selected} />
              <LoungeMetaText>{selected.postedAt}</LoungeMetaText>
            </View>
            <View className="mt-3">
              <LoungeTitle>{selected.title}</LoungeTitle>
            </View>
            <Text
              style={{
                marginTop: 6,
                fontFamily: 'Pretendard-Medium',
                fontSize: 14,
                color: lounge.textSecondary,
              }}
            >
              {selected.company}
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-2">
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={14} color={lounge.textMuted} />
                <Text
                  style={{
                    marginLeft: 4,
                    fontFamily: 'Pretendard',
                    fontSize: 12,
                    color: lounge.textSecondary,
                  }}
                >
                  {selected.location}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="cash-outline" size={14} color={lounge.textMuted} />
                <Text
                  style={{
                    marginLeft: 4,
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: 12,
                    color: lounge.green,
                  }}
                >
                  {selected.salary}
                </Text>
              </View>
              {selected.schedule ? (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color={lounge.textMuted} />
                  <Text
                    style={{
                      marginLeft: 4,
                      fontFamily: 'Pretendard',
                      fontSize: 12,
                      color: lounge.textSecondary,
                    }}
                  >
                    {selected.schedule}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="mt-4">
              <RichContentRenderer content={selected.requirements} />
            </View>
            <View className="mt-4">
              <ReportContentButton
                contentId={selected.id}
                contentType="job"
                preview={selected.title}
              />
            </View>
            {isSelectedAuthor ? (
              <CommunityAuthorActions onEdit={handleEditJob} onDelete={handleDeleteJob} />
            ) : null}
          </LoungeCard>

          <CommunityCommentSection
            postId={selected.id}
            canWrite={Boolean(user)}
            writeDeniedMessage="댓글을 작성하려면 로그인이 필요합니다."
            sectionLabel="댓글"
            placeholder="공고에 대한 문의나 의견을 남겨 주세요"
            submitLabel="댓글 등록"
          />
        </CommunityPostDetailLayout>
        {writeModal}
      </LoungeScreen>
    );
  }

  return (
    <LoungeScreen>
      <ParamedicHeader />

      <View className="flex-1">
        <FlatList
          ref={listRef}
          data={jobPosts}
          extraData={currentPage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={loungeListContentStyle}
          ListHeaderComponent={
            <CommunityListScrollHeader error={error}>
              <CommunityBestSection
                items={bestItems}
                renderItem={(post) => (
                  <JobCard post={post} onPress={() => setSelected(post)} />
                )}
              />
            </CommunityListScrollHeader>
          }
          ListEmptyComponent={
            loading && jobPosts.length === 0 ? (
              <View className="items-center py-16">
                <ActivityIndicator color={lounge.accent} />
              </View>
            ) : (
              <View className="items-center py-16">
                <Ionicons name="briefcase-outline" size={48} color={lounge.textMuted} />
                <Text
                  style={{
                    marginTop: 16,
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: 15,
                    color: lounge.textSecondary,
                  }}
                >
                  등록된 공고가 없습니다
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <CommunityListPagination
              currentPage={currentPage}
              totalCount={totalCount}
              hasMultiplePages={hasMultiplePages}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          }
          renderItem={({ item }) => <JobCard post={item} onPress={() => setSelected(item)} />}
        />

        <LoungeFab
          onPress={openWriteChooser}
          accessibilityLabel="구인·구직 글쓰기"
          icon="create-outline"
        />
      </View>

      {writeModal}
    </LoungeScreen>
  );
}
