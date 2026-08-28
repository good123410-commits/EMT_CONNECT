import { supabase } from '@/lib/supabaseClient';
import type { HomeBanner } from '@/types/homeDashboard';

export const HOME_EVENT_BANNERS_TABLE = 'kemix_home_event_banners';
export const KEMIX_MEDIA_BUCKET = 'kemix-media';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type HomeEventBannerRow = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export class HomeBannerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HomeBannerServiceError';
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

function assertValidBannerId(id: string): string {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new HomeBannerServiceError('배너 ID가 필요합니다.');
  }
  if (!UUID_RE.test(trimmedId)) {
    throw new HomeBannerServiceError(`유효하지 않은 배너 ID입니다: ${trimmedId}`);
  }
  return trimmedId;
}

export function mapRowToHomeBanner(row: HomeEventBannerRow): HomeBanner {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type UpsertHomeBannerInput = {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  linkUrl: string;
  isActive?: boolean;
  sortOrder?: number;
};

export async function fetchActiveHomeEventBanners(): Promise<HomeBanner[]> {
  const { data, error } = await supabase.rpc('list_active_home_event_banners');
  if (error) {
    throw new HomeBannerServiceError(error.message);
  }
  return ((data ?? []) as HomeEventBannerRow[]).map(mapRowToHomeBanner);
}

export async function fetchAllHomeEventBanners(): Promise<HomeBanner[]> {
  const { data, error } = await supabase.rpc('admin_list_home_event_banners');

  if (error) {
    if (isMissingRpcError(error.message)) {
      throw new HomeBannerServiceError(
        'admin_list_home_event_banners RPC가 없습니다. migration_v69_home_event_banners_admin_rpc.sql을 적용해 주세요.',
      );
    }
    throw new HomeBannerServiceError(error.message);
  }

  return ((data ?? []) as HomeEventBannerRow[]).map(mapRowToHomeBanner);
}

export async function upsertHomeEventBanner(input: UpsertHomeBannerInput): Promise<HomeBanner> {
  const { data, error } = await supabase.rpc('admin_upsert_home_event_banner', {
    p_id: input.id ?? null,
    p_title: input.title.trim(),
    p_description: input.description.trim(),
    p_image_url: input.imageUrl?.trim() || null,
    p_link_url: input.linkUrl.trim(),
    p_is_active: input.isActive ?? true,
    p_sort_order: input.sortOrder ?? 0,
  });

  if (error || !data) {
    throw new HomeBannerServiceError(error?.message ?? '배너 저장에 실패했습니다.');
  }

  return mapRowToHomeBanner(data as HomeEventBannerRow);
}

async function deleteHomeEventBannerDirect(id: string): Promise<void> {
  const { error, count } = await supabase
    .from(HOME_EVENT_BANNERS_TABLE)
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    throw new HomeBannerServiceError(error.message);
  }

  if (!count) {
    throw new HomeBannerServiceError('배너를 찾을 수 없거나 삭제 권한이 없습니다.');
  }
}

export async function deleteHomeEventBanner(id: string): Promise<void> {
  const targetId = assertValidBannerId(id);

  if (__DEV__) {
    console.log('[deleteHomeEventBanner] targetId:', targetId);
  }

  const { data, error } = await supabase.rpc('admin_delete_home_event_banner', {
    p_id: targetId,
  });

  if (error) {
    if (isMissingRpcError(error.message)) {
      if (__DEV__) {
        console.warn(
          '[deleteHomeEventBanner] RPC missing, falling back to direct table delete:',
          targetId,
        );
      }
      await deleteHomeEventBannerDirect(targetId);
      return;
    }

    if (error.message.toLowerCase().includes('not authorized')) {
      throw new HomeBannerServiceError('관리자 권한이 없어 배너를 삭제할 수 없습니다.');
    }

    throw new HomeBannerServiceError(error.message);
  }

  if (data !== true) {
    throw new HomeBannerServiceError(
      `배너를 찾을 수 없습니다. (id=${targetId})`,
    );
  }
}

export async function uploadHomeBannerImage(fileUri: string, mimeType = 'image/jpeg'): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `home-banners/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(KEMIX_MEDIA_BUCKET).upload(path, blob, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new HomeBannerServiceError(error.message);
  }

  const { data } = supabase.storage.from(KEMIX_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
