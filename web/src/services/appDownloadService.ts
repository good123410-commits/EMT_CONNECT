import { supabase } from '../lib/supabase';
import type { AppDownloadSettings } from '../types';

const DEFAULT_SETTINGS: AppDownloadSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  ios_store_url: import.meta.env.VITE_APP_STORE_URL ?? '',
  android_store_url: import.meta.env.VITE_PLAY_STORE_URL ?? '',
  deep_link: import.meta.env.VITE_APP_DEEP_LINK ?? 'emtconnect://map',
  latest_version: null,
  qr_code_image_url: null,
  description: '',
  updated_at: new Date().toISOString(),
};

export async function fetchAppDownloadSettings(): Promise<AppDownloadSettings> {
  const { data, error } = await supabase.rpc('get_app_download_settings');
  if (error) throw error;
  if (!data) return DEFAULT_SETTINGS;
  return data as AppDownloadSettings;
}

export type UpdateAppDownloadInput = {
  ios_store_url?: string;
  android_store_url?: string;
  deep_link?: string;
  latest_version?: string | null;
  qr_code_image_url?: string | null;
  description?: string;
};

export async function adminUpdateAppDownloadSettings(
  input: UpdateAppDownloadInput,
): Promise<AppDownloadSettings> {
  const { data, error } = await supabase.rpc('admin_update_app_download_settings', {
    p_ios_store_url: input.ios_store_url ?? null,
    p_android_store_url: input.android_store_url ?? null,
    p_deep_link: input.deep_link ?? null,
    p_latest_version: input.latest_version ?? null,
    p_qr_code_image_url: input.qr_code_image_url ?? null,
    p_description: input.description ?? null,
  });
  if (error) throw error;
  return data as AppDownloadSettings;
}

export function subscribeAppDownloadSettings(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemix_app_download_settings_web')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kemix_app_download_settings' },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function mergeAppDownloadSettings(
  settings: AppDownloadSettings | null,
): AppDownloadSettings {
  if (!settings) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    ios_store_url: settings.ios_store_url || DEFAULT_SETTINGS.ios_store_url,
    android_store_url: settings.android_store_url || DEFAULT_SETTINGS.android_store_url,
    deep_link: settings.deep_link || DEFAULT_SETTINGS.deep_link,
  };
}
