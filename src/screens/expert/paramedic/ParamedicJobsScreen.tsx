import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import {
  LoungeActionRow,
  LoungeCard,
  LoungeErrorBanner,
  LoungeFilterPill,
  LoungeFilterRow,
  LoungeInput,
  LoungeMetaText,
  LoungePrimaryButton,
  LoungeScreen,
  LoungeTitle,
  LoungeTopSection,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import type { JobPost } from '@/data/paramedicMockData';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useParamedicTabWrite } from '@/hooks/useParamedicTabWrite';

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

function JobCard({ post }: { post: JobPost }) {
  const { lounge } = useEmsLoungeTheme();
  return (
    <LoungeCard>
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
  const loungeListContentStyle = useLoungeListContentStyle();
  const { jobPosts, postJobSeek, postJobHire, loading, error } = useParamedicCommunity();
  const [writeMode, setWriteMode] = useState<JobWriteMode | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [company, setCompany] = useState('');
  const [salary, setSalary] = useState('');
  const [schedule, setSchedule] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hire' | 'seek'>('all');

  const filtered = jobPosts.filter((p) => filter === 'all' || p.type === filter);

  const openWriteChooser = useCallback(() => setWriteMode('choose'), []);
  useParamedicTabWrite('Jobs', openWriteChooser);

  const closeWriteModal = () => {
    setWriteMode(null);
    setTitle('');
    setLocation('');
    setContent('');
    setCompany('');
    setSalary('');
    setSchedule('');
    setIsUrgent(false);
  };

  useHardwareBackHandler(() => {
    if (writeMode) {
      if (writeMode === 'choose') {
        closeWriteModal();
      } else {
        setWriteMode('choose');
      }
      return true;
    }
    return false;
  }, Boolean(writeMode));

  const handleSubmitSeek = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 필요', '제목과 내용을 입력해 주세요.');
      return;
    }
    try {
      await postJobSeek(title.trim(), content.trim(), location.trim() || '전국');
      closeWriteModal();
      Alert.alert('등록 완료', '구직 글이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handleSubmitHire = async () => {
    if (!title.trim() || !company.trim() || !content.trim()) {
      Alert.alert('입력 필요', '제목, 기관명, 채용 내용을 입력해 주세요.');
      return;
    }
    try {
      await postJobHire({
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || '미정',
        salary: salary.trim() || '협의',
        schedule: schedule.trim() || '협의',
        requirements: content.trim(),
        isUrgent,
      });
      closeWriteModal();
      Alert.alert('등록 완료', '구인 글이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const modalTitle =
    writeMode === 'hire' ? '구인 글쓰기' : writeMode === 'seek' ? '구직 글쓰기' : '글 유형 선택';

  return (
    <LoungeScreen>
      <ParamedicHeader />

      <LoungeTopSection>
        <LoungeFilterRow>
          {(['all', 'hire', 'seek'] as const).map((f) => (
            <LoungeFilterPill
              key={f}
              label={f === 'all' ? '전체' : f === 'hire' ? '구인' : '구직'}
              active={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </LoungeFilterRow>
      </LoungeTopSection>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={loungeListContentStyle}
        ListHeaderComponent={error ? <LoungeErrorBanner message={error} /> : null}
        ListEmptyComponent={
          loading ? (
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
        renderItem={({ item }) => <JobCard post={item} />}
      />

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
                  <LoungePrimaryButton
                    label="구인 글쓰기"
                    onPress={() => setWriteMode('hire')}
                  />
                  <LoungePrimaryButton
                    label="구직 글쓰기"
                    onPress={() => setWriteMode('seek')}
                  />
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
                  <LoungeInput value={location} onChangeText={setLocation} placeholder="예: 서울, 경기" />
                  <FieldLabel>이력 · 자기소개</FieldLabel>
                  <LoungeInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="면허, 경력, 희망 근무 조건 등을 작성해 주세요"
                    multiline
                    minHeight={120}
                  />
                  <LoungePrimaryButton label="구직 글 등록" onPress={() => void handleSubmitSeek()} />
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
                  <LoungeInput value={company} onChangeText={setCompany} placeholder="예: ○○소방서" />
                  <FieldLabel>근무 지역</FieldLabel>
                  <LoungeInput value={location} onChangeText={setLocation} placeholder="예: 서울 강남구" />
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
                  <LoungePrimaryButton label="구인 글 등록" onPress={() => void handleSubmitHire()} />
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LoungeScreen>
  );
}
