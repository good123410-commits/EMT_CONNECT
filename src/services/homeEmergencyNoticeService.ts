import { supabase } from '@/lib/supabaseClient';
import type { HomeEmergencyNotice, UpsertHomeEmergencyNoticeInput } from '@/types/emergencyTicker';
import { EMERGENCY_NOTICES_TABLE } from '@/services/emergencyTickerService';

type EmergencyNoticeRow = {
  id: string;
  message: string;
  is_active: boolean;
  sort_order: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export class HomeEmergencyNoticeServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HomeEmergencyNoticeServiceError';
  }
}

function isMissingRpcError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('could not find the function') ||
    normalized.includes('pgrst202') ||
    normalized.includes('schema cache')
  );
}

function mapRow(row: EmergencyNoticeRow): HomeEmergencyNotice {
  return {
    id: row.id,
    message: row.message,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAllHomeEmergencyNotices(): Promise<HomeEmergencyNotice[]> {
  const { data, error } = await supabase.rpc('admin_list_home_emergency_notices');

  if (error) {
    if (isMissingRpcError(error.message)) {
      throw new HomeEmergencyNoticeServiceError(
        'admin_list_home_emergency_notices RPC가 없습니다. migration_v72_emergency_ticker.sql을 적용해 주세요.',
      );
    }
    throw new HomeEmergencyNoticeServiceError(error.message);
  }

  return ((data ?? []) as EmergencyNoticeRow[]).map(mapRow);
}

export async function upsertHomeEmergencyNotice(
  input: UpsertHomeEmergencyNoticeInput,
): Promise<HomeEmergencyNotice> {
  const { data, error } = await supabase.rpc('admin_upsert_home_emergency_notice', {
    p_id: input.id ?? null,
    p_message: input.message.trim(),
    p_is_active: input.isActive ?? true,
    p_sort_order: input.sortOrder ?? 0,
    p_expires_at: input.expiresAt ?? null,
  });

  if (error || !data) {
    throw new HomeEmergencyNoticeServiceError(error?.message ?? '긴급 공지 저장에 실패했습니다.');
  }

  return mapRow(data as EmergencyNoticeRow);
}

export async function deleteHomeEmergencyNotice(id: string): Promise<void> {
  const { data, error } = await supabase.rpc('admin_delete_home_emergency_notice', {
    p_id: id,
  });

  if (error) {
    if (isMissingRpcError(error.message)) {
      const { error: directError, count } = await supabase
        .from(EMERGENCY_NOTICES_TABLE)
        .delete({ count: 'exact' })
        .eq('id', id);

      if (directError) {
        throw new HomeEmergencyNoticeServiceError(directError.message);
      }
      if (!count) {
        throw new HomeEmergencyNoticeServiceError('긴급 공지를 찾을 수 없습니다.');
      }
      return;
    }
    throw new HomeEmergencyNoticeServiceError(error.message);
  }

  if (data !== true) {
    throw new HomeEmergencyNoticeServiceError('긴급 공지를 찾을 수 없습니다.');
  }
}
