import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { RichContentRenderer } from '@/components/content/RichContentRenderer';
import {
  LoungeActionRow,
  LoungeAnonymousBadge,
  LoungeBody,
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
  LoungeWriteBar,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { EMS_LOUNGE, EMS_LOUNGE_SPACING } from '@/constants/emsLoungeTheme';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { JobPost } from '@/data/paramedicMockData';

function JobTypeBadge({ post }: { post: JobPost }) {
  const isSeek = post.type === 'seek';
  const bg = isSeek ? EMS_LOUNGE.accentMuted : post.isUrgent ? EMS_LOUNGE.errorBg : EMS_LOUNGE.greenSoft;
  const color = isSeek ? EMS_LOUNGE.accentSoft : post.isUrgent ? EMS_LOUNGE.error : EMS_LOUNGE.green;
  const label = isSeek ? '구직' : post.isUrgent ? '긴급채용' : '구인';

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
      <Text style={{ fontFamily: 'Pretendard-Bold', fontSize: 10, color }}>{label}</Text>
    </View>
  );
}

function JobCard({ post }: { post: JobPost }) {
  return (
    <LoungeCard>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <JobTypeBadge post={post} />
            <LoungeMetaText>{post.postedAt}</LoungeMetaText>
          </View>
          <View className="mt-3">
            <LoungeTitle numberOfLines={2}>{post.title}</LoungeTitle>
          </View>
          <Text
            style={{
              marginTop: 4,
              fontFamily: 'Pretendard-Medium',
              fontSize: 14,
              color: EMS_LOUNGE.textSecondary,
            }}
          >
            {post.company}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={EMS_LOUNGE.textMuted} />
      </View>

      <View className="mt-4 gap-2">
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={14} color={EMS_LOUNGE.textMuted} />
          <Text
            style={{
              marginLeft: 6,
              fontFamily: 'Pretendard',
              fontSize: 12,
              color: EMS_LOUNGE.textSecondary,
            }}
          >
            {post.location}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={14} color={EMS_LOUNGE.textMuted} />
          <Text
            style={{
              marginLeft: 6,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 12,
              color: EMS_LOUNGE.green,
            }}
          >
            {post.salary}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color={EMS_LOUNGE.textMuted} />
          <Text
            style={{
              marginLeft: 6,
              fontFamily: 'Pretendard',
              fontSize: 12,
              color: EMS_LOUNGE.textSecondary,
            }}
          >
            {post.schedule}
          </Text>
        </View>
      </View>

      <View
        className="mt-4"
        style={{
          borderRadius: 14,
          backgroundColor: EMS_LOUNGE.background,
          padding: 12,
        }}
      >
        <RichContentRenderer content={post.requirements} tone="lounge" />
      </View>

      <LoungeActionRow
        right={
          <ReportContentButton contentId={post.id} contentType="job" preview={post.title} />
        }
      />
    </LoungeCard>
  );
}

export function ParamedicJobsScreen() {
  const loungeListContentStyle = useLoungeListContentStyle();
  const { jobPosts, postJobSeek, loading, error } = useParamedicCommunity();
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'hire' | 'seek'>('all');

  const filtered = jobPosts.filter((p) => filter === 'all' || p.type === filter);

  useHardwareBackHandler(() => {
    if (showWriteForm) {
      setShowWriteForm(false);
      return true;
    }
    return false;
  }, showWriteForm);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 필요', '제목과 내용을 입력해 주세요.');
      return;
    }
    try {
      await postJobSeek(title.trim(), content.trim(), location.trim() || '전국');
      setTitle('');
      setLocation('');
      setContent('');
      setShowWriteForm(false);
      Alert.alert('등록 완료', '구직 글이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <LoungeScreen>
      <ParamedicHeader />

      <LoungeWriteBar label="글쓰기" onPress={() => setShowWriteForm(true)} />

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
              <ActivityIndicator color={EMS_LOUNGE.accent} />
            </View>
          ) : (
            <View className="items-center py-16">
              <Ionicons name="briefcase-outline" size={48} color={EMS_LOUNGE.textMuted} />
              <Text
                style={{
                  marginTop: 16,
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 15,
                  color: EMS_LOUNGE.textSecondary,
                }}
              >
                등록된 공고가 없습니다
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <JobCard post={item} />}
      />

      <Modal visible={showWriteForm} animationType="slide" transparent>
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable className="flex-1 bg-black/40" onPress={() => setShowWriteForm(false)} />
          <View
            className="max-h-[85%] px-4 pb-8 pt-4"
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: EMS_LOUNGE.surface,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text
                style={{
                  fontFamily: 'Pretendard-Bold',
                  fontSize: 18,
                  color: EMS_LOUNGE.text,
                }}
              >
                구직 글쓰기
              </Text>
              <Pressable onPress={() => setShowWriteForm(false)}>
                <Ionicons name="close" size={24} color={EMS_LOUNGE.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  marginBottom: 4,
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 12,
                  color: EMS_LOUNGE.textMuted,
                }}
              >
                제목
              </Text>
              <LoungeInput
                value={title}
                onChangeText={setTitle}
                placeholder="예: 119 경력 5년 · 야간 근무 희망"
              />
              <Text
                style={{
                  marginBottom: 4,
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 12,
                  color: EMS_LOUNGE.textMuted,
                }}
              >
                희망 지역
              </Text>
              <LoungeInput value={location} onChangeText={setLocation} placeholder="예: 서울, 경기" />
              <Text
                style={{
                  marginBottom: 4,
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 12,
                  color: EMS_LOUNGE.textMuted,
                }}
              >
                이력 · 자기소개
              </Text>
              <LoungeInput
                value={content}
                onChangeText={setContent}
                placeholder="면허, 경력, 희망 근무 조건 등을 작성해 주세요"
                multiline
                minHeight={120}
              />
              <LoungePrimaryButton label="구직 글 등록" onPress={() => void handleSubmit()} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LoungeScreen>
  );
}
