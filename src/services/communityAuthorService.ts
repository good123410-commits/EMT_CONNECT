import { supabase } from '@/lib/supabaseClient';
import {
  EMS_COMMUNITY_POSTS_TABLE,
  EmsCommunityServiceError,
  type EmsCommunityPostRow,
} from '@/services/emsCommunityService';

export type UpdateCommunityPostByAuthorInput = {
  title?: string | null;
  summary?: string | null;
  content?: string;
  isSecret?: boolean;
  companyName?: string | null;
  jobLocation?: string | null;
  salary?: string | null;
  schedule?: string | null;
  isUrgent?: boolean;
};

function parseServiceError(message: string): string {
  if (message.includes('not_authenticated')) return '로그인이 필요합니다.';
  if (message.includes('row-level security')) return '수정·삭제 권한이 없습니다.';
  return message;
}

export async function updateCommunityPostByAuthor(
  postId: string,
  input: UpdateCommunityPostByAuthorInput,
): Promise<EmsCommunityPostRow> {
  const trimmedId = postId.trim();
  if (!trimmedId) throw new EmsCommunityServiceError('게시글을 찾을 수 없습니다.');

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) payload.title = input.title?.trim() || null;
  if (input.summary !== undefined) payload.summary = input.summary?.trim() || null;
  if (input.content !== undefined) payload.content = input.content.trim();
  if (input.isSecret !== undefined) payload.is_secret = input.isSecret;
  if (input.companyName !== undefined) payload.company_name = input.companyName?.trim() || null;
  if (input.jobLocation !== undefined) payload.job_location = input.jobLocation?.trim() || null;
  if (input.salary !== undefined) payload.salary = input.salary?.trim() || null;
  if (input.schedule !== undefined) payload.schedule = input.schedule?.trim() || null;
  if (input.isUrgent !== undefined) payload.is_urgent = input.isUrgent;

  const { data, error } = await supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .update(payload)
    .eq('id', trimmedId)
    .select('*')
    .single();

  if (error) {
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  if (!data) {
    throw new EmsCommunityServiceError('게시글을 수정하지 못했습니다.');
  }

  return data as EmsCommunityPostRow;
}

export async function deleteCommunityPostByAuthor(postId: string): Promise<void> {
  const trimmedId = postId.trim();
  if (!trimmedId) throw new EmsCommunityServiceError('게시글을 찾을 수 없습니다.');

  const { data, error } = await supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .delete()
    .eq('id', trimmedId)
    .select('id');

  if (error) {
    throw new EmsCommunityServiceError(parseServiceError(error.message));
  }

  if (!data?.length) {
    throw new EmsCommunityServiceError(
      '게시글을 삭제하지 못했습니다. 작성자 본인인지와 migration_v67 적용 여부를 확인해 주세요.',
    );
  }
}
