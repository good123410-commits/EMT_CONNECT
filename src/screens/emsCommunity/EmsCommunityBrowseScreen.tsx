import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { supabase } from '@/lib/supabaseClient';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { BambooMessage, CaseStudyPost } from '@/data/paramedicMockData';
import { EMS_COMMUNITY_POSTS_TABLE, fetchCommunityFeed, mapRowToBamboo, mapRowToCaseStudy, type EmsCommunityPostRow } from '@/services/emsCommunityService';

type BrowsePost =
  | { kind: 'case_study'; post: CaseStudyPost }
  | { kind: 'bamboo'; post: BambooMessage };

function BrowsePostCard({
  item,
  onPress,
}: {
  item: BrowsePost;
  onPress: (item: BrowsePost) => void;
}) {
  const title =
    item.kind === 'case_study' ? item.post.title : item.post.content.slice(0, 48);
  const summary =
    item.kind === 'case_study'
      ? item.post.summary
      : item.post.content.length > 80
        ? `${item.post.content.slice(0, 80)}…`
        : item.post.content;

  return (
    <Pressable
      className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
      onPress={() => onPress(item)}
    >
      <View className="flex-row items-center justify-between">
        <View className="rounded-full bg-emerald-50 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-emerald-700">
            {item.kind === 'case_study' ? '케이스' : '자유글'}
          </Text>
        </View>
        {item.kind === 'bamboo' && item.post.isHot ? (
          <Text className="text-[10px] font-bold text-orange-600">🔥 HOT</Text>
        ) : null}
      </View>
      <Text className="mt-2 text-base font-bold text-slate-900" numberOfLines={2}>
        {title}
      </Text>
      <Text className="mt-1 text-sm leading-6 text-slate-600" numberOfLines={2}>
        {summary}
      </Text>
      <Text className="mt-2 text-xs text-slate-400">
        {item.post.anonymousLabel} · {item.post.postedAt}
      </Text>
    </Pressable>
  );
}

function BrowsePostDetail({
  item,
  onBack,
}: {
  item: BrowsePost;
  onBack: () => void;
}) {
  useHardwareBackHandler(onBack, true);

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 py-3">
        <Pressable className="flex-row items-center" onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
          <Text className="ml-2 font-semibold text-slate-900">게시글</Text>
        </Pressable>
      </SafeAreaView>
      <ScrollView contentContainerClassName="p-4 pb-10">
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          {item.kind === 'case_study' ? (
            <>
              <Text className="text-lg font-bold text-slate-900">{item.post.title}</Text>
              <Text className="mt-2 text-sm leading-7 text-slate-700">{item.post.body}</Text>
            </>
          ) : (
            <Text className="text-sm leading-7 text-slate-700">{item.post.content}</Text>
          )}
          <Text className="mt-4 text-xs text-slate-400">
            {item.post.anonymousLabel} · {item.post.postedAt}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * 게스트·비회원용 EMS 커뮤니티 탐색 화면 — 목록·상세 열람, 작성은 로그인 후
 */
export function EmsCommunityBrowseScreen() {
  const [posts, setPosts] = useState<BrowsePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BrowsePost | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginIntent, setLoginIntent] = useState<'question-write' | 'community-write'>(
    'question-write',
  );

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from(EMS_COMMUNITY_POSTS_TABLE)
        .select('*')
        .eq('is_hidden', false)
        .in('post_type', ['case_study', 'bamboo'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      const rows = (data ?? []) as EmsCommunityPostRow[];
      const merged: BrowsePost[] = rows.map((row) =>
        row.post_type === 'case_study'
          ? { kind: 'case_study', post: mapRowToCaseStudy(row) }
          : { kind: 'bamboo', post: mapRowToBamboo(row) },
      );

      if (merged.length === 0) {
        const feed = await fetchCommunityFeed();
        setPosts([
          ...feed.caseStudies.map((post) => ({ kind: 'case_study' as const, post })),
          ...feed.bamboo.map((post) => ({ kind: 'bamboo' as const, post })),
        ]);
      } else {
        setPosts(merged);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const openLogin = useCallback((intent: 'question-write' | 'community-write') => {
    setLoginIntent(intent);
    setLoginOpen(true);
  }, []);

  const loginModalProps = useMemo(
    () =>
      loginIntent === 'community-write'
        ? {
            title: '로그인이 필요한 서비스입니다',
            description: '글을 작성하려면 로그인 또는 회원가입이 필요합니다.',
            intent: { type: 'community-write' as const },
          }
        : {
            title: '로그인이 필요한 서비스입니다',
            description: '구급대원 및 전문가에게 질문을 남기시려면 로그인이 필요합니다.',
            intent: { type: 'question-write' as const },
          },
    [loginIntent],
  );

  if (selected) {
    return <BrowsePostDetail item={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-4">
        <Text className="text-xl font-bold text-slate-900">{EMS_COMMUNITY_TAB_LABEL}</Text>
        <Text className="mt-1 text-sm text-slate-500">
          응급의료인들의 경험과 정보를 둘러보세요
        </Text>
        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-green-700 py-3.5 active:bg-green-800"
          onPress={() => openLogin('question-write')}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text className="ml-2 font-bold text-white">질문하기</Text>
        </Pressable>
      </SafeAreaView>

      <View className="flex-1 px-4 pt-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          게시글 목록
        </Text>

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#15803d" />
          </View>
        ) : null}

        {error ? (
          <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {!loading ? (
          <FlatList
            data={posts}
            keyExtractor={(item) => `${item.kind}-${item.post.id}`}
            renderItem={({ item }) => (
              <BrowsePostCard item={item} onPress={setSelected} />
            )}
            ListEmptyComponent={
              <View className="items-center rounded-2xl border border-dashed border-slate-200 bg-white py-16">
                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                <Text className="mt-3 text-sm text-slate-500">아직 게시글이 없습니다</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 96 }}
          />
        ) : null}
      </View>

      <Pressable
        className="absolute bottom-6 right-4 flex-row items-center rounded-full bg-green-700 px-5 py-3.5 shadow-lg active:bg-green-800"
        onPress={() => openLogin('community-write')}
      >
        <Ionicons name="pencil" size={18} color="#fff" />
        <Text className="ml-2 font-bold text-white">글쓰기</Text>
      </Pressable>

      <GuestLoginPromptModal
        visible={loginOpen}
        onClose={() => setLoginOpen(false)}
        title={loginModalProps.title}
        description={loginModalProps.description}
        intent={loginModalProps.intent}
      />
    </View>
  );
}
