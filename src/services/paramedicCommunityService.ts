import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';

const PLEDGE_STORAGE_PREFIX = 'ems_community_pledge_v1';

export type CommunityReportInput = {
  reporterId: string;
  contentId: string;
  contentType: 'post' | 'comment' | 'job' | 'chat';
  preview: string;
  reason?: string;
};

/**
 * Supabase 연동 뼈대 — profiles.role / is_approved 기반 승인 여부.
 * 클라이언트 UI 가드는 UserRoleContext.isApprovedParamedic 과 병행 사용.
 */
export async function verifyParamedicApprovalFromBackend(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.role === 'paramedic' && data.is_approved === true;
}

export async function hasAcceptedCommunityPledge(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(`${PLEDGE_STORAGE_PREFIX}:${userId}`);
  return value === 'true';
}

export async function acceptCommunityPledge(userId: string): Promise<void> {
  await AsyncStorage.setItem(`${PLEDGE_STORAGE_PREFIX}:${userId}`, 'true');

  // TODO: Supabase community_pledges 테이블에 동의 시각 기록
  // await supabase.from('community_pledges').upsert({ user_id: userId, accepted_at: new Date().toISOString() });
}

export async function submitCommunityReport(input: CommunityReportInput): Promise<void> {
  // TODO: Supabase community_reports 테이블 insert
  // await supabase.from('community_reports').insert({ ...input, created_at: new Date().toISOString() });
  console.log('[EMS Community] report submitted', {
    contentId: input.contentId,
    contentType: input.contentType,
    preview: input.preview.slice(0, 80),
  });
}
