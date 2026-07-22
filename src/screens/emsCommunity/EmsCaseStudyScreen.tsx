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
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
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
    <Pressable
      className="mb-3 rounded-2xl border border-green-200 bg-white p-4 active:bg-green-50/40"
      onPress={() => onOpen(post)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-base font-bold text-slate-900">{post.title}</Text>
          <Text className="mt-1 text-xs text-slate-500">
            {post.anonymousLabel} · {post.postedAt}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
      <Text className="mt-2 text-sm leading-6 text-slate-600" numberOfLines={3}>
        {post.summary}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <View key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5">
            <Text className="text-[10px] font-medium text-slate-600">#{tag}</Text>
          </View>
        ))}
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
        <Pressable className="flex-row items-center" onPress={() => void onLike(post.id)}>
          <Ionicons name="heart-outline" size={16} color="#64748b" />
          <Text className="ml-1 text-xs text-slate-500">{post.likes}</Text>
        </Pressable>
        <ReportContentButton
          contentId={post.id}
          contentType="post"
          preview={post.title}
          compact
        />
      </View>
    </Pressable>
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
      <View className="flex-1 bg-green-50/30">
        <ParamedicHeader subtitle="지식 공유 · 케이스 스터디" />
        <ScrollView contentContainerClassName="p-4 pb-28">
          <Pressable className="mb-4 flex-row items-center" onPress={() => setSelected(null)}>
            <Ionicons name="arrow-back" size={22} color="#14532d" />
            <Text className="ml-2 font-semibold text-green-900">목록</Text>
          </Pressable>
          <View className="rounded-2xl border border-green-200 bg-white p-4">
            <Text className="text-lg font-bold text-slate-900">{selected.title}</Text>
            <Text className="mt-1 text-xs text-slate-500">
              {selected.anonymousLabel} · {selected.postedAt}
            </Text>
            <Text className="mt-4 text-sm leading-7 text-slate-700">{selected.body}</Text>
            <View className="mt-4 flex-row justify-end">
              <ReportContentButton
                contentId={selected.id}
                contentType="post"
                preview={selected.title}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-50/30">
      <ParamedicHeader subtitle="지식 공유 · 케이스 스터디" />

      <View className="border-b border-green-200 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-bold text-slate-900">현장 처치 사례 · 스터디</Text>
            <Text className="mt-0.5 text-xs text-slate-500">환자 정보 익명화 필수 · 면허 인증 대원 전용</Text>
          </View>
          <Pressable
            className="rounded-xl bg-green-700 px-4 py-2"
            onPress={() => setComposing((v) => !v)}
          >
            <Text className="text-xs font-bold text-white">{composing ? '닫기' : '글쓰기'}</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {composing ? (
          <View className="border-b border-green-200 bg-white p-4">
            <TextInput
              className="mb-2 rounded-xl border border-green-200 bg-green-50/50 px-3 py-2 text-sm"
              placeholder="케이스 제목"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              className="mb-2 rounded-xl border border-green-200 bg-green-50/50 px-3 py-2 text-sm"
              placeholder="한 줄 요약"
              value={summary}
              onChangeText={setSummary}
            />
            <TextInput
              className="min-h-[100px] rounded-xl border border-green-200 bg-green-50/50 px-3 py-2 text-sm"
              placeholder="처치 경과·교훈 (환자 실명·식별정보 금지)"
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {STUDY_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 ${selectedTags.includes(tag) ? 'bg-green-700' : 'bg-slate-100'}`}
                >
                  <Text
                    className={`text-xs font-medium ${selectedTags.includes(tag) ? 'text-white' : 'text-slate-600'}`}
                  >
                    #{tag}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable className="mt-3 items-center rounded-xl bg-green-700 py-3" onPress={() => void handlePost()}>
              <Text className="font-bold text-white">케이스 등록</Text>
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <View className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {loading && caseStudies.length === 0 ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color="#15803d" />
          </View>
        ) : (
        <FlatList
          data={caseStudies}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-28"
          renderItem={({ item }) => (
            <CaseStudyCard post={item} onLike={likeCaseStudy} onOpen={setSelected} />
          )}
        />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
