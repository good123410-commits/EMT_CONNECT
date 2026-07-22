import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { useKemiGuides } from '@/hooks/useKemiGuides';
import {
  fetchGuideBySlug,
  formatKemiPostDate,
  stripGuideHtml,
} from '@/services/kemiPostService';
import type { KemiGuide } from '@/types/kemiGuide';

export function KemiBlogSection() {
  const { guides, loading, error } = useKemiGuides({ limit: 30 });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<KemiGuide | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setDetailLoading(true);
      const row = await fetchGuideBySlug(selectedSlug);
      if (!cancelled) {
        setDetail(row);
        setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color="#047857" />
        <Text className="mt-2 text-xs text-slate-400">생활 응급처치 가이드 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Text className="text-sm text-amber-800">{error}</Text>
      </View>
    );
  }

  if (guides.length === 0) {
    return (
      <EmptyState
        message="아직 공개된 가이드 글이 없습니다"
        hint="KEMI 홈페이지와 동일한 콘텐츠가 여기에 표시됩니다"
      />
    );
  }

  return (
    <View>
      {guides.map((post) => (
        <Pressable
          key={post.id}
          className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          onPress={() => setSelectedSlug(post.slug)}
        >
          <Text className="text-base font-bold text-slate-900">{post.title}</Text>
          <Text className="mt-1 text-xs text-slate-500">{formatKemiPostDate(post.created_at)}</Text>
          {post.seo_description ? (
            <Text className="mt-2 text-sm text-slate-600" numberOfLines={2}>
              {post.seo_description}
            </Text>
          ) : null}
        </Pressable>
      ))}

      <Modal visible={selectedSlug !== null} animationType="slide" onRequestClose={() => setSelectedSlug(null)}>
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
            <Pressable onPress={() => setSelectedSlug(null)}>
              <Text className="text-sm font-bold text-emerald-700">닫기</Text>
            </Pressable>
            <Text className="text-sm font-semibold text-slate-700">생활 응급처치 가이드</Text>
            <View className="w-10" />
          </View>
          {detailLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#047857" />
            </View>
          ) : detail ? (
            <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 32 }}>
              <Text className="text-xl font-bold text-slate-900">{detail.title}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                {formatKemiPostDate(detail.created_at)} · 조회 {detail.views}
              </Text>
              <View className="mt-4 rounded-2xl bg-slate-50 p-4">
                <Text className="text-sm leading-7 text-slate-800" selectable>
                  {stripGuideHtml(detail.content)}
                </Text>
              </View>
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center p-6">
              <Text className="text-sm text-slate-500">글을 불러오지 못했습니다.</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
