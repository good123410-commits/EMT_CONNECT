import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { KoreanRegionSelector, KoreanRegionTitle } from '@/components/utilities/KoreanRegionSelector';
import { LocalCommunityCategoryChips } from '@/components/utilities/LocalCommunityCategoryChips';
import { LocalCommunityPostCard } from '@/components/utilities/LocalCommunityPostCard';
import { LocalCommunityWriteForm } from '@/components/utilities/LocalCommunityWriteForm';
import { UtilityToolShell } from '@/components/utilities/UtilityToolShell';
import { KOREAN_SIGUNGU_UNITS } from '@/constants/koreanRegions';
import {
  createLocalCommunityPost,
  fetchLocalCommunityPosts,
  filterVisiblePosts,
  loadSelectedRegionCode,
  reportLocalCommunityPost,
  saveSelectedRegionCode,
  subscribeLocalCommunityRegion,
} from '@/services/localCommunityService';
import { getLocationWithRegion } from '@/services/locationService';
import type { LocalCommunityCategory, LocalCommunityPost } from '@/types/localCommunity';
import {
  getRegionUnitByCode,
  parseRegionRouteParam,
  resolveRegionCodeFromLocation,
} from '@/utils/koreanRegionResolver';
import { POST_TTL_MS, REPORT_BLIND_THRESHOLD } from '@/utils/localCommunityModeration';

const COMMUNITY_ROUTE_PATH = 'local-community';

function isLocalCommunityDeepLink(url: string): string | null {
  if (!url.includes(COMMUNITY_ROUTE_PATH)) return null;
  const match = url.match(/[?&]region=([^&]+)/);
  if (!match?.[1]) return null;
  return parseRegionRouteParam(match[1]);
}

export function LocalCommunityTalkScreen() {
  const [bootLoading, setBootLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [regionCode, setRegionCode] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<LocalCommunityCategory | 'all'>('all');
  const [writeCategory, setWriteCategory] = useState<LocalCommunityCategory>('pediatric_wait');
  const [posts, setPosts] = useState<LocalCommunityPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const loadPosts = useCallback(async (code: string) => {
    setPostsLoading(true);
    try {
      const rows = await fetchLocalCommunityPosts(code);
      setPosts(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '톡 목록을 불러오지 못했습니다.');
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const applyRegionCode = useCallback(async (code: string) => {
    setRegionCode(code);
    await saveSelectedRegionCode(code);
  }, []);

  useEffect(() => {
    void (async () => {
      const saved = await loadSelectedRegionCode();
      if (saved && getRegionUnitByCode(saved)) {
        setRegionCode(saved);
      } else {
        try {
          const snapshot = await getLocationWithRegion();
          const detected = resolveRegionCodeFromLocation(snapshot.region);
          if (detected) {
            setRegionCode(detected);
            await saveSelectedRegionCode(detected);
          } else {
            setRegionCode(KOREAN_SIGUNGU_UNITS[0]?.code ?? null);
          }
        } catch {
          setRegionCode(KOREAN_SIGUNGU_UNITS[0]?.code ?? null);
        }
      }
      setBootLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!regionCode) return;

    void loadPosts(regionCode);

    const unsubscribe = subscribeLocalCommunityRegion(regionCode, () => {
      void loadPosts(regionCode);
    });

    return unsubscribe;
  }, [regionCode, loadPosts]);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const code = isLocalCommunityDeepLink(event.url);
      if (code) void applyRegionCode(code);
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (!url) return;
      const code = isLocalCommunityDeepLink(url);
      if (code) void applyRegionCode(code);
    });

    return () => subscription.remove();
  }, [applyRegionCode]);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (categoryFilter !== 'all') {
      setWriteCategory(categoryFilter);
    }
  }, [categoryFilter]);

  const selectedRegion = getRegionUnitByCode(regionCode);

  const visiblePosts = useMemo(() => {
    if (!regionCode) return [];
    return filterVisiblePosts(posts, regionCode, categoryFilter);
  }, [posts, regionCode, categoryFilter, tick]);

  const handleSubmit = async (content: string) => {
    if (!regionCode) {
      Alert.alert('지역 선택', '먼저 시·군·구를 선택해 주세요.');
      return;
    }
    const post = await createLocalCommunityPost({
      regionCode,
      category: writeCategory,
      content,
    });
    setPosts((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
  };

  const handleReport = async (postId: string) => {
    const result = await reportLocalCommunityPost(postId);
    if (regionCode) {
      void loadPosts(regionCode);
    }
    return result;
  };

  if (bootLoading) {
    return (
      <UtilityToolShell>
        <Text className="text-center text-sm text-kemix-text-secondary">불러오는 중…</Text>
      </UtilityToolShell>
    );
  }

  return (
    <UtilityToolShell>
      <View className="mb-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
        <View className="flex-row items-center">
          <Ionicons name="chatbubbles-outline" size={20} color="#0d9488" />
          <Text className="ml-2 text-sm font-bold text-teal-900">지역별 익명 커뮤니티</Text>
        </View>
        <Text className="mt-2 text-xs leading-5 text-teal-800">
          전국 {KOREAN_SIGUNGU_UNITS.length}개 시·군·구 게시판. 소아과 대기·야간 진료·응급/육아
          정보를 익명으로 공유합니다. 게시글은 {POST_TTL_MS / (60 * 60 * 1000)}시간 후 자동 삭제,
          신고 {REPORT_BLIND_THRESHOLD}회 이상 시 자동 숨김. 실시간으로 동기화됩니다.
        </Text>
      </View>

      <KoreanRegionSelector
        selectedCode={regionCode}
        onSelect={(code) => void applyRegionCode(code)}
        detecting={detecting}
        onDetectStart={() => setDetecting(true)}
        onDetectEnd={() => setDetecting(false)}
      />

      {selectedRegion ? (
        <View className="mb-4">
          <KoreanRegionTitle unit={selectedRegion} />
        </View>
      ) : null}

      <LocalCommunityCategoryChips value={categoryFilter} onChange={setCategoryFilter} />

      <LocalCommunityWriteForm category={writeCategory} onSubmit={handleSubmit} />

      {error ? (
        <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      ) : null}

      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[11px] text-kemix-muted">
          {postsLoading ? '동기화 중…' : '실시간 연결'}
        </Text>
        <Text className="text-[11px] text-kemix-muted">{visiblePosts.length}건</Text>
      </View>

      {postsLoading && visiblePosts.length === 0 ? (
        <Text className="text-center text-sm text-kemix-text-secondary">톡을 불러오는 중…</Text>
      ) : visiblePosts.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-10">
          <Ionicons name="chatbubble-ellipses-outline" size={32} color="#cbd5e1" />
          <Text className="mt-3 text-sm text-kemix-text-secondary">이 지역에 아직 글이 없습니다.</Text>
          <Text className="mt-1 text-xs text-kemix-muted">첫 글을 익명으로 등록해 보세요.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {visiblePosts.map((post) => (
            <LocalCommunityPostCard key={post.id} post={post} onReport={handleReport} />
          ))}
        </View>
      )}
    </UtilityToolShell>
  );
}
