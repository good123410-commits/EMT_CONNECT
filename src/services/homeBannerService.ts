import { supabase } from '@/lib/supabaseClient';
import type { HomeBanner } from '@/types/homeDashboard';

export const HOME_EVENT_BANNERS_TABLE = 'kemix_home_event_banners';
export const KEMIX_MEDIA_BUCKET = 'kemix-media';

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
  const { data, error } = await supabase
    .from(HOME_EVENT_BANNERS_TABLE)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new HomeBannerServiceError(error.message);
  }
  return ((data ?? []) as HomeEventBannerRow[]).map(mapRowToHomeBanner);
}

export async function upsertHomeEventBanner(input: UpsertHomeBannerInput): Promise<HomeBanner> {
  const payload = {
    title: input.title.trim(),
    description: input.description.trim(),
    image_url: input.imageUrl?.trim() || null,
    link_url: input.linkUrl.trim(),
    is_active: input.isActive ?? true,
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from(HOME_EVENT_BANNERS_TABLE)
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new HomeBannerServiceError(error?.message ?? '배너 수정에 실패했습니다.');
    }
    return mapRowToHomeBanner(data as HomeEventBannerRow);
  }

  const { data, error } = await supabase
    .from(HOME_EVENT_BANNERS_TABLE)
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new HomeBannerServiceError(error?.message ?? '배너 추가에 실패했습니다.');
  }
  return mapRowToHomeBanner(data as HomeEventBannerRow);
}

export async function deleteHomeEventBanner(id: string): Promise<void> {
  const { error } = await supabase.from(HOME_EVENT_BANNERS_TABLE).delete().eq('id', id);
  if (error) {
    throw new HomeBannerServiceError(error.message);
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
