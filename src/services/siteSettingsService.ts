import { supabase } from '@/lib/supabaseClient';

export type SiteSettingKey =
  | 'privacy_policy'
  | 'terms_of_service'
  | 'service_info'
  | 'official_website'
  | 'donation_notice';

export type SiteSetting = {
  key: SiteSettingKey | string;
  title: string;
  content: string;
  updated_at: string;
};

const OFFICIAL_WEBSITE_URL = 'https://www.k-emix.com';

const FALLBACKS: Partial<Record<SiteSettingKey, SiteSetting>> = {
  official_website: {
    key: 'official_website',
    title: '공식 웹사이트',
    content: OFFICIAL_WEBSITE_URL,
    updated_at: new Date().toISOString(),
  },
  donation_notice: {
    key: 'donation_notice',
    title: '후원 안내',
    content: '',
    updated_at: new Date().toISOString(),
  },
};

export { OFFICIAL_WEBSITE_URL };

export async function fetchSiteSetting(key: SiteSettingKey): Promise<SiteSetting> {
  const { data, error } = await supabase.rpc('get_site_setting', { p_key: key });
  if (!error && data) {
    return data as SiteSetting;
  }
  return FALLBACKS[key] ?? { key, title: key, content: '', updated_at: new Date().toISOString() };
}

export async function fetchOfficialWebsiteUrl(): Promise<string> {
  const setting = await fetchSiteSetting('official_website');
  return setting.content.trim() || OFFICIAL_WEBSITE_URL;
}

export async function fetchDonationNotice(): Promise<string> {
  const setting = await fetchSiteSetting('donation_notice');
  return setting.content.trim();
}
