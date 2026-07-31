import AsyncStorage from '@react-native-async-storage/async-storage';

import { subscribeLocalCommunityPosts } from '@/lib/realtimeSubscription';
import { supabase } from '@/lib/supabaseClient';
import type { LocalCommunityCategory, LocalCommunityPost } from '@/types/localCommunity';
import { generateAnonymousLabel, isPostExpired } from '@/utils/localCommunityModeration';

export const LOCAL_COMMUNITY_POSTS_TABLE = 'local_community_posts';

const REGION_KEY = 'kemix_local_community_region_v2';
const LEGACY_AREA_KEY = 'kemix_local_community_area_v1';
const REPORTS_KEY = 'kemix_local_community_reports_v1';

export type LocalCommunityPostRow = {
  id: string;
  region_code: string;
  category: LocalCommunityCategory;
  content: string;
  anonymous_label: string;
  created_at: string;
  expires_at: string;
  report_count: number;
  is_blinded: boolean;
  author_id: string | null;
};

export class LocalCommunityServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalCommunityServiceError';
  }
}

function mapRow(row: LocalCommunityPostRow): LocalCommunityPost {
  return {
    id: row.id,
    regionCode: row.region_code,
    category: row.category,
    content: row.content,
    anonymousLabel: row.anonymous_label,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    reportCount: row.report_count,
    isBlinded: row.is_blinded,
  };
}

function parseServiceError(error: { message?: string; code?: string }): string {
  const message = error.message ?? '요청을 처리하지 못했습니다.';
  if (message.includes('post_not_found_or_hidden')) {
    return '글을 찾을 수 없거나 이미 숨김·만료되었습니다.';
  }
  return message;
}

export async function loadSelectedRegionCode(): Promise<string | null> {
  const saved = await AsyncStorage.getItem(REGION_KEY);
  if (saved) return saved;
  return AsyncStorage.getItem(LEGACY_AREA_KEY);
}

export async function saveSelectedRegionCode(regionCode: string): Promise<void> {
  await AsyncStorage.setItem(REGION_KEY, regionCode);
}

async function loadReportedPostIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

async function saveReportedPostId(postId: string): Promise<void> {
  const set = await loadReportedPostIds();
  set.add(postId);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify([...set]));
}

export async function fetchLocalCommunityPosts(
  regionCode: string,
  category?: LocalCommunityCategory | 'all',
): Promise<LocalCommunityPost[]> {
  let query = supabase
    .from(LOCAL_COMMUNITY_POSTS_TABLE)
    .select('*')
    .eq('region_code', regionCode)
    .eq('is_blinded', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(200);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new LocalCommunityServiceError(parseServiceError(error));
  }

  return (data as LocalCommunityPostRow[]).map(mapRow);
}

export async function createLocalCommunityPost(input: {
  regionCode: string;
  category: LocalCommunityCategory;
  content: string;
}): Promise<LocalCommunityPost> {
  const trimmed = input.content.trim();
  if (!trimmed) {
    throw new LocalCommunityServiceError('내용을 입력해 주세요.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(LOCAL_COMMUNITY_POSTS_TABLE)
    .insert({
      region_code: input.regionCode,
      category: input.category,
      content: trimmed,
      anonymous_label: generateAnonymousLabel(),
      author_id: user?.id ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new LocalCommunityServiceError(parseServiceError(error ?? { message: 'insert_failed' }));
  }

  return mapRow(data as LocalCommunityPostRow);
}

export async function reportLocalCommunityPost(postId: string): Promise<{
  alreadyReported: boolean;
  blinded: boolean;
}> {
  const reported = await loadReportedPostIds();
  if (reported.has(postId)) {
    return { alreadyReported: true, blinded: false };
  }

  const { data, error } = await supabase.rpc('report_local_community_post', {
    p_post_id: postId,
  });

  if (error) {
    throw new LocalCommunityServiceError(parseServiceError(error));
  }

  const payload = data as { blinded?: boolean; is_blinded?: boolean } | null;
  const blinded = Boolean(payload?.blinded ?? payload?.is_blinded);

  await saveReportedPostId(postId);

  return { alreadyReported: false, blinded };
}

export function filterVisiblePosts(
  posts: LocalCommunityPost[],
  regionCode: string,
  category: LocalCommunityCategory | 'all',
): LocalCommunityPost[] {
  return posts
    .filter((post) => post.regionCode === regionCode)
    .filter((post) => category === 'all' || post.category === category)
    .filter((post) => !isPostExpired(post))
    .filter((post) => !post.isBlinded);
}

export function subscribeLocalCommunityRegion(
  regionCode: string,
  onChange: () => void,
): () => void {
  return subscribeLocalCommunityPosts(regionCode, onChange);
}
