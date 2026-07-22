import { supabase } from '@/lib/supabaseClient';
import type {
  BambooMessage,
  CaseStudyPost,
  ChatMessage,
  JobPost,
  ResourceDocument,
} from '@/data/paramedicMockData';

export type EmsCommunityPostType =
  | 'bamboo'
  | 'case_study'
  | 'chat'
  | 'job_seek'
  | 'job_hire'
  | 'resource';

export const EMS_COMMUNITY_POSTS_TABLE = 'ems_community_posts';

export type EmsCommunityPostRow = {
  id: string;
  post_type: EmsCommunityPostType;
  title: string | null;
  summary: string | null;
  content: string;
  tags: string[] | null;
  room_id: string | null;
  region: string | null;
  anonymous_label: string;
  likes: number;
  is_hot: boolean;
  job_location: string | null;
  company_name: string | null;
  salary: string | null;
  schedule: string | null;
  is_urgent: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  hidden_at: string | null;
  hidden_by: string | null;
};

export type AdminCommunityPost = EmsCommunityPostRow;

export type ModerationBoard = 'case_study' | 'resource' | 'jobs';

const JOB_POST_TYPES: EmsCommunityPostType[] = ['job_seek', 'job_hire'];

export type UpsertCommunityPostInput = {
  postType: EmsCommunityPostType;
  title?: string | null;
  summary?: string | null;
  content: string;
  tags?: string[];
  roomId?: string | null;
  region?: string | null;
  anonymousLabel?: string;
  isHot?: boolean;
  jobLocation?: string | null;
  companyName?: string | null;
  salary?: string | null;
  schedule?: string | null;
  isUrgent?: boolean;
  likes?: number;
};

export class EmsCommunityServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmsCommunityServiceError';
  }
}

function formatRelativeTimeKo(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return iso;
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return '방금';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export type UpsertResourceDocumentInput = {
  title: string;
  category: string;
  description: string;
  url: string;
  isExternal?: boolean;
};

function formatResourceDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function resourceTags(category: string, isExternal?: boolean): string[] {
  const tags = [category.trim() || '기타'];
  if (isExternal) tags.push('external');
  return tags;
}

function parseResourceCategory(tags: string[] | null | undefined): string {
  return normalizeTags(tags).find((tag) => tag !== 'external') ?? '기타';
}

export function mapRowToResource(row: EmsCommunityPostRow): ResourceDocument {
  const tags = normalizeTags(row.tags);
  return {
    id: row.id,
    title: row.title ?? '제목 없음',
    category: parseResourceCategory(tags),
    description: row.summary ?? '',
    url: row.content,
    updatedAt: formatResourceDate(row.updated_at),
    isExternal: tags.includes('external'),
  };
}

function mapResourceToUpsertInput(input: UpsertResourceDocumentInput): UpsertCommunityPostInput {
  return {
    postType: 'resource',
    title: input.title,
    summary: input.description,
    content: input.url,
    tags: resourceTags(input.category, input.isExternal),
    anonymousLabel: '관리자',
  };
}

function parseServiceError(message: string): string {
  if (message.includes('not_authorized_community')) {
    return '승인된 구급대원 또는 관리자만 글을 작성할 수 있습니다.';
  }
  if (message.includes('not_authorized_admin')) {
    return '승인된 DB 관리자만 이 작업을 수행할 수 있습니다.';
  }
  if (message.includes('post_not_found')) {
    return '게시글을 찾을 수 없습니다.';
  }
  if (message.includes('relation') && message.includes('ems_community_posts')) {
    return '커뮤니티 DB가 설치되지 않았습니다. migration_v8_ems_community_posts.sql을 실행해 주세요.';
  }
  if (message.includes('is_hidden') && message.includes('does not exist')) {
    return '모더레이션 DB가 설치되지 않았습니다. migration_v19_ems_community_moderation.sql을 실행해 주세요.';
  }
  return message;
}

export function mapRowToBamboo(row: EmsCommunityPostRow): BambooMessage {
  return {
    id: row.id,
    anonymousLabel: row.anonymous_label,
    region: row.region ?? '전국',
    content: row.content,
    tags: normalizeTags(row.tags),
    postedAt: formatRelativeTimeKo(row.created_at),
    likes: row.likes,
    isHot: row.is_hot,
  };
}

export function mapRowToCaseStudy(row: EmsCommunityPostRow): CaseStudyPost {
  return {
    id: row.id,
    title: row.title ?? '제목 없음',
    anonymousLabel: row.anonymous_label,
    summary: row.summary ?? '',
    body: row.content,
    tags: normalizeTags(row.tags),
    postedAt: formatRelativeTimeKo(row.created_at),
    likes: row.likes,
  };
}

export function mapRowToChat(row: EmsCommunityPostRow): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id ?? 'all',
    anonymousLabel: row.anonymous_label,
    content: row.content,
    postedAt: formatRelativeTimeKo(row.created_at),
  };
}

export function mapRowToJobSeek(row: EmsCommunityPostRow): JobPost {
  return {
    id: row.id,
    type: 'seek',
    title: row.title ?? '구직 등록',
    company: row.company_name ?? '구직자 등록',
    location: row.job_location ?? '미정',
    salary: row.salary ?? '협의',
    schedule: row.schedule ?? '협의',
    requirements: row.content,
    postedAt: formatRelativeTimeKo(row.created_at),
    isUrgent: row.is_urgent,
  };
}

export function mapRowToJobHire(row: EmsCommunityPostRow): JobPost {
  return {
    id: row.id,
    type: 'hire',
    title: row.title ?? '구인 공고',
    company: row.company_name ?? '채용 기관',
    location: row.job_location ?? '미정',
    salary: row.salary ?? '협의',
    schedule: row.schedule ?? '협의',
    requirements: row.content,
    postedAt: formatRelativeTimeKo(row.created_at),
    isUrgent: row.is_urgent,
  };
}

function mapRowToJobPost(row: EmsCommunityPostRow): JobPost {
  return row.post_type === 'job_hire' ? mapRowToJobHire(row) : mapRowToJobSeek(row);
}

async function fetchPostsByType(postType: EmsCommunityPostType, roomId?: string): Promise<EmsCommunityPostRow[]> {
  let query = supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .select('*')
    .eq('post_type', postType)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(200);

  if (roomId) {
    query = query.eq('room_id', roomId);
  }

  const { data, error } = await query;
  if (error) {
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }
  return (data ?? []) as EmsCommunityPostRow[];
}

export async function fetchCaseStudies(): Promise<CaseStudyPost[]> {
  const rows = await fetchPostsByType('case_study');
  return rows.map(mapRowToCaseStudy);
}

export async function fetchResources(): Promise<ResourceDocument[]> {
  const rows = await fetchPostsByType('resource');
  return rows.map(mapRowToResource);
}

export async function adminUpsertResourceDocument(
  input: UpsertResourceDocumentInput & { id?: string },
): Promise<ResourceDocument> {
  const upsertInput = mapResourceToUpsertInput(input);
  if (input.id) {
    const row = await adminUpdateCommunityPost(input.id, upsertInput);
    return mapRowToResource(row);
  }
  const row = await insertPost(upsertInput);
  return mapRowToResource(row);
}

export async function adminDeleteResourceDocument(id: string): Promise<void> {
  await adminDeleteCommunityPost(id);
}

function normalizeTags(tags: string[] | null | undefined): string[] {
  return (tags ?? []).filter(Boolean);
}

export async function fetchChatMessages(roomId: string): Promise<ChatMessage[]> {
  const rows = await fetchPostsByType('chat', roomId);
  return rows.map(mapRowToChat);
}

export async function fetchJobPosts(): Promise<JobPost[]> {
  const [seeks, hires] = await Promise.all([
    fetchPostsByType('job_seek'),
    fetchPostsByType('job_hire'),
  ]);
  const merged = [...hires, ...seeks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return merged.map(mapRowToJobPost);
}

export type CommunityFeed = {
  bamboo: BambooMessage[];
  caseStudies: CaseStudyPost[];
  chatMessages: ChatMessage[];
  jobPosts: JobPost[];
  resources: ResourceDocument[];
};

export async function fetchCommunityFeed(): Promise<CommunityFeed> {
  const { data, error } = await supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .select('*')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  const rows = (data ?? []) as EmsCommunityPostRow[];
  const bamboo: BambooMessage[] = [];
  const caseStudies: CaseStudyPost[] = [];
  const chatMessages: ChatMessage[] = [];
  const jobPosts: JobPost[] = [];
  const resources: ResourceDocument[] = [];

  for (const row of rows) {
    switch (row.post_type) {
      case 'bamboo':
        bamboo.push(mapRowToBamboo(row));
        break;
      case 'case_study':
        caseStudies.push(mapRowToCaseStudy(row));
        break;
      case 'chat':
        chatMessages.push(mapRowToChat(row));
        break;
      case 'job_seek':
      case 'job_hire':
        jobPosts.push(mapRowToJobPost(row));
        break;
      case 'resource':
        resources.push(mapRowToResource(row));
        break;
      default:
        break;
    }
  }

  return { bamboo, caseStudies, chatMessages, jobPosts, resources };
}

async function insertPost(input: UpsertCommunityPostInput): Promise<EmsCommunityPostRow> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    throw new EmsCommunityServiceError('로그인 후 글을 작성할 수 있습니다.');
  }

  const payload = {
    post_type: input.postType,
    title: input.title?.trim() || null,
    summary: input.summary?.trim() || null,
    content: input.content.trim(),
    tags: input.tags ?? [],
    room_id: input.roomId ?? null,
    region: input.region?.trim() || null,
    anonymous_label: input.anonymousLabel?.trim() || pickAnonymousLabel(),
    is_hot: input.isHot ?? false,
    job_location: input.jobLocation?.trim() || null,
    company_name: input.companyName?.trim() || null,
    salary: input.salary?.trim() || null,
    schedule: input.schedule?.trim() || null,
    is_urgent: input.isUrgent ?? false,
    author_id: auth.user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  return data as EmsCommunityPostRow;
}

export async function createBambooPost(content: string, tags: string[], region = '전국') {
  const row = await insertPost({
    postType: 'bamboo',
    content,
    tags,
    region,
  });
  return mapRowToBamboo(row);
}

export async function createCaseStudyPost(
  title: string,
  summary: string,
  body: string,
  tags: string[],
): Promise<CaseStudyPost> {
  const row = await insertPost({
    postType: 'case_study',
    title,
    summary,
    content: body,
    tags,
  });
  return mapRowToCaseStudy(row);
}

export async function createChatPost(roomId: string, content: string): Promise<ChatMessage> {
  const row = await insertPost({
    postType: 'chat',
    content,
    roomId,
  });
  return mapRowToChat(row);
}

export async function createJobSeekPost(
  title: string,
  content: string,
  location: string,
): Promise<JobPost> {
  const row = await insertPost({
    postType: 'job_seek',
    title,
    content,
    jobLocation: location,
    companyName: '구직자 등록',
    salary: '협의',
    schedule: '협의',
  });
  return mapRowToJobSeek(row);
}

export async function createJobHirePost(input: {
  title: string;
  company: string;
  location: string;
  salary: string;
  schedule: string;
  requirements: string;
  isUrgent?: boolean;
}): Promise<JobPost> {
  const row = await insertPost({
    postType: 'job_hire',
    title: input.title,
    content: input.requirements,
    companyName: input.company,
    jobLocation: input.location,
    salary: input.salary,
    schedule: input.schedule,
    isUrgent: input.isUrgent ?? false,
  });
  return mapRowToJobHire(row);
}

export async function incrementCommunityLikes(id: string): Promise<number> {
  const { data, error } = await supabase.rpc('increment_ems_community_likes', {
    p_post_id: id,
  });

  if (!error && data) {
    const row = data as EmsCommunityPostRow;
    return row.likes;
  }

  if (error && !error.message.toLowerCase().includes('could not find the function')) {
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  const { data: current, error: readError } = await supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .select('likes')
    .eq('id', id)
    .maybeSingle();

  if (readError) throw new EmsCommunityServiceError(readError.message);
  if (!current) return 0;

  const nextLikes = (Number(current.likes) || 0) + 1;
  const { error: updateError } = await supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .update({ likes: nextLikes, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) throw new EmsCommunityServiceError(updateError.message);
  return nextLikes;
}

const ANONYMOUS_LABELS = [
  '익명 · 서울',
  '익명 · 경기',
  '익명 · 부산',
  '익명 · 대구',
  '익명 · 광주',
  '익명 · 대전',
];

function pickAnonymousLabel(): string {
  return ANONYMOUS_LABELS[Math.floor(Math.random() * ANONYMOUS_LABELS.length)] ?? '익명';
}

export async function adminListCommunityPosts(
  postType?: EmsCommunityPostType,
): Promise<AdminCommunityPost[]> {
  let query = supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (postType) {
    query = query.eq('post_type', postType);
  }

  const { data, error } = await query;
  if (error) {
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }
  return (data ?? []) as AdminCommunityPost[];
}

export async function adminListCommunityPostsForModeration(
  board: ModerationBoard,
  options?: { includeHidden?: boolean },
): Promise<AdminCommunityPost[]> {
  let query = supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (board === 'jobs') {
    query = query.in('post_type', JOB_POST_TYPES);
  } else {
    query = query.eq('post_type', board);
  }

  if (!options?.includeHidden) {
    query = query.eq('is_hidden', false);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[CommunityModeration] adminListCommunityPostsForModeration failed', {
      board,
      message: error.message,
      code: error.code,
    });
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  return (data ?? []) as AdminCommunityPost[];
}

export async function adminHideCommunityPost(postId: string): Promise<AdminCommunityPost> {
  const { data, error } = await supabase.rpc('admin_set_community_post_hidden', {
    p_post_id: postId,
    p_hidden: true,
  });

  if (error) {
    console.error('[CommunityModeration] adminHideCommunityPost RPC failed', {
      postId,
      message: error.message,
      code: error.code,
    });
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  if (!data) {
    throw new EmsCommunityServiceError('게시글을 숨기지 못했습니다.');
  }

  return data as AdminCommunityPost;
}

export async function adminUnhideCommunityPost(postId: string): Promise<AdminCommunityPost> {
  const { data, error } = await supabase.rpc('admin_set_community_post_hidden', {
    p_post_id: postId,
    p_hidden: false,
  });

  if (error) {
    console.error('[CommunityModeration] adminUnhideCommunityPost RPC failed', {
      postId,
      message: error.message,
      code: error.code,
    });
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  if (!data) {
    throw new EmsCommunityServiceError('게시글 숨김을 해제하지 못했습니다.');
  }

  return data as AdminCommunityPost;
}

export async function adminDeleteCommunityPost(id: string): Promise<void> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('admin_delete_community_post', {
    p_post_id: id,
  });

  if (!rpcError && rpcData) {
    if (__DEV__) {
      console.log('[CommunityModeration] adminDeleteCommunityPost RPC success', { id });
    }
    return;
  }

  if (rpcError && !rpcError.message.toLowerCase().includes('could not find the function')) {
    console.error('[CommunityModeration] adminDeleteCommunityPost RPC failed', {
      id,
      message: rpcError.message,
      code: rpcError.code,
    });
    throw new EmsCommunityServiceError(parseServiceError(rpcError.message));
  }

  const { data, error } = await supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    console.error('[CommunityModeration] adminDeleteCommunityPost delete failed', {
      id,
      message: error.message,
      code: error.code,
    });
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  if (!data?.length) {
    throw new EmsCommunityServiceError(
      '글이 삭제되지 않았습니다. 관리자 권한과 migration_v19_ems_community_moderation.sql 적용 여부를 확인해 주세요.',
    );
  }
}

export async function adminUpdateCommunityPost(
  id: string,
  input: UpsertCommunityPostInput,
): Promise<AdminCommunityPost> {
  const payload = {
    post_type: input.postType,
    title: input.title?.trim() || null,
    summary: input.summary?.trim() || null,
    content: input.content.trim(),
    tags: input.tags ?? [],
    room_id: input.roomId ?? null,
    region: input.region?.trim() || null,
    anonymous_label: input.anonymousLabel?.trim() || '익명',
    is_hot: input.isHot ?? false,
    job_location: input.jobLocation?.trim() || null,
    company_name: input.companyName?.trim() || null,
    salary: input.salary?.trim() || null,
    schedule: input.schedule?.trim() || null,
    is_urgent: input.isUrgent ?? false,
    likes: input.likes ?? 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .update(payload)
    .eq('id', id)
    .select('*');

  if (error) {
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  const rows = (data ?? []) as AdminCommunityPost[];
  if (!rows.length) {
    throw new EmsCommunityServiceError(
      '글이 수정되지 않았습니다. migration_v8_ems_community_posts.sql 및 관리자 승인 상태를 확인해 주세요.',
    );
  }

  return rows[0];
}

export function formatAdminPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function summarizeAdminPost(row: AdminCommunityPost): string {
  if (row.summary?.trim()) return row.summary.trim();
  const text = row.content?.trim() ?? '';
  if (text.length <= 120) return text;
  return `${text.slice(0, 120)}…`;
}

export function moderationBoardLabel(board: ModerationBoard): string {
  switch (board) {
    case 'case_study':
      return '케이스';
    case 'resource':
      return '자료실';
    case 'jobs':
      return '구인구직';
    default:
      return board;
  }
}

export function moderationPostTypeLabel(postType: EmsCommunityPostType): string {
  switch (postType) {
    case 'case_study':
      return '케이스';
    case 'resource':
      return '자료실';
    case 'job_seek':
      return '구직';
    case 'job_hire':
      return '구인';
    default:
      return postType;
  }
}
