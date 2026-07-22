import { supabase } from '../lib/supabase';
import type { SiteSetting, SiteSettingKey } from '../types';

const FALLBACKS: Record<SiteSettingKey, SiteSetting> = {
  privacy_policy: {
    key: 'privacy_policy',
    title: '개인정보 처리방침',
    content: '<p>개인정보 처리방침 콘텐츠를 준비 중입니다.</p>',
    updated_at: new Date().toISOString(),
  },
  terms_of_service: {
    key: 'terms_of_service',
    title: '이용약관',
    content: '<p>이용약관 콘텐츠를 준비 중입니다.</p>',
    updated_at: new Date().toISOString(),
  },
  service_info: {
    key: 'service_info',
    title: 'KEMIX 서비스 정보',
    content: '<p><strong>버전:</strong> v1.0</p>',
    updated_at: new Date().toISOString(),
  },
};

export async function fetchSiteSetting(key: SiteSettingKey): Promise<SiteSetting> {
  try {
    const { data, error } = await supabase.rpc('get_site_setting', { p_key: key });
    if (!error && data) {
      const row = data as SiteSetting;
      return row;
    }
  } catch {
    // fallback
  }
  return FALLBACKS[key];
}

export async function adminListSiteSettings(): Promise<SiteSetting[]> {
  const { data, error } = await supabase.rpc('admin_list_site_settings');
  if (error) throw error;
  return (data ?? []) as SiteSetting[];
}

export async function adminUpsertSiteSetting(input: {
  key: SiteSettingKey | string;
  title: string;
  content: string;
}): Promise<SiteSetting> {
  const { data, error } = await supabase.rpc('admin_upsert_site_setting', {
    p_key: input.key,
    p_title: input.title,
    p_content: input.content,
  });
  if (error) throw error;
  return data as SiteSetting;
}
