import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import {
  LoungeActionRow,
  LoungeAnonymousBadge,
  LoungeBackBar,
  LoungeBody,
  LoungeCard,
  LoungeErrorBanner,
  LoungeInput,
  LoungeLikeButton,
  LoungeMetaText,
  LoungePrimaryButton,
  LoungeScreen,
  LoungeTag,
  LoungeTitle,
  LoungeWriteBar,
  loungeListContent,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { EMS_LOUNGE, EMS_LOUNGE_SPACING } from '@/constants/emsLoungeTheme';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { CaseStudyPost } from '@/data/paramedicMockData';

const STUDY_TAGS = ['케이스스터디', '전원', 'ROSC', '외상', '소아', '기도', '현장팁'];

function CaseStudyCard({
  post,
  onLike,
  onOpen,
}: {
  post: CaseStudyPost;
  onLike: (id: string) => void;
  onOpen: (post: CaseStudyPost) => void;
}) {
  return (
    <LoungeCard onPress={() => onOpen(post)}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <LoungeTitle numberOfLines={2}>{post.title}</LoungeTitle>
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <LoungeAnonymousBadge label={post.anonymousLabel} />
            <LoungeMetaText>{post.postedAt}</LoungeMetaText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={EMS_LOUNGE.textMuted} />
      </View>
      <View className="mt-3">
        <LoungeBody numberOfLines={3}>{post.summary}</LoungeBody>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {post.tags.map((tag) => <LoungeTag key={tag} label={tag} />)}
      </View>
      <LoungeActionRow
        left={<LoungeLikeButton count={post.likes} onPress={() => void onLike(post.id)} />}
        right={
          <ReportContentButton
            contentId={post.id}
            contentType="post"
            preview={post.title}
            compact
          />
        }
      />
    </LoungeCard>
  );
}

export function EmsCaseStudyScreen() {
  const { caseStudies, postCaseStudy, likeCaseStudy, loading, error } = useParamedicCommunity();
  const [composing, setComposing] = useState(false);
  const [selected, setSelected] = useState<CaseStudyPost | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['케이스스터디']);

  useHardwareBackHandler(() => {
    if (selected) {
      setSelected(null);
      return true;
    }
    if (composing) {
      setComposing(false);
      return true;
    }
    return false;
  }, Boolean(selected || composing));

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handlePost = async () => {
    if (title.trim().length < 4 || body.trim().length < 10) {
      Alert.alert('입력 부족', '제목 4자 이상, 본문 10자 이상 입력해 주세요.');
      return;
    }
    try {
      await postCaseStudy(
        title.trim(),
        summary.trim() || body.trim().slice(0, 80),
        body.trim(),
        selectedTags.length > 0 ? selectedTags : ['케이스스터디'],
      );
      setTitle('');
      setSummary('');
      setBody('');
      setComposing(false);
      Alert.alert('등록 완료', '케이스가 익명으로 등록되었습니다. 환자 정보는 포함하지 마세요.');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  if (selected) {
    return (
      <LoungeScreen>
        <ParamedicHeader />
        <ScrollView contentContainerStyle={{ paddingBottom: 112 }}>
          <LoungeBackBar label="목록" onPress={() => setSelected(null)} />
          <View style={{ paddingHorizontal: EMS_LOUNGE_SPACING.screen }}>
            <LoungeCard>
              <LoungeTitle>{selected.title}</LoungeTitle>
              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                <LoungeAnonymousBadge label={selected.anonymousLabel} />
                <LoungeMetaText>{selected.postedAt}</LoungeMetaText>
              </View>
              <View className="mt-4">
                <LoungeBody>{selected.body}</LoungeBody>
              </View>
              {selected.tags.length > 0 ? (
                <View className="mt-4 flex-row flex-wrap gap-2">
                  {selected.tags.map((tag) => <LoungeTag key={tag} label={tag} />)}
                </View>
              ) : null}
              <View className="mt-4 flex-row justify-end">
                <ReportContentButton
                  contentId={selected.id}
                  contentType="post"
                  preview={selected.title}
                />
              </View>
            </LoungeCard>
          </View>
        </ScrollView>
      </LoungeScreen>
    );
  }

  return (
    <LoungeScreen>
      <ParamedicHeader />

      <LoungeWriteBar
        label={composing ? '닫기' : '글쓰기'}
        onPress={() => setComposing((v) => !v)}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {composing ? (
          <View
            style={{
              paddingHorizontal: EMS_LOUNGE_SPACING.screen,
              paddingBottom: 16,
              marginBottom: 8,
            }}
          >
            <LoungeInput value={title} onChangeText={setTitle} placeholder="케이스 제목" />
            <LoungeInput value={summary} onChangeText={setSummary} placeholder="한 줄 요약" />
            <LoungeInput
              value={body}
              onChangeText={setBody}
              placeholder="처치 경과·교훈 (환자 실명·식별정보 금지)"
              multiline
              minHeight={100}
            />
            <View className="mb-3 flex-row flex-wrap gap-2">
              {STUDY_TAGS.map((tag) => (
                <LoungeTag
                  key={tag}
                  label={tag}
                  active={selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                />
              ))}
            </View>
            <LoungePrimaryButton label="케이스 등록" onPress={() => void handlePost()} />
          </View>
        ) : null}

        {error ? <LoungeErrorBanner message={error} /> : null}

        {loading && caseStudies.length === 0 ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color={EMS_LOUNGE.navy} />
          </View>
        ) : (
          <FlatList
            data={caseStudies}
            keyExtractor={(item) => item.id}
            contentContainerStyle={loungeListContent}
            renderItem={({ item }) => (
              <CaseStudyCard post={item} onLike={likeCaseStudy} onOpen={setSelected} />
            )}
          />
        )}
      </KeyboardAvoidingView>
    </LoungeScreen>
  );
}
