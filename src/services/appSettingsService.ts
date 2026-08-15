import { supabase } from '@/lib/supabaseClient';
import { KAKAOTALK_PAY_LINK_FALLBACK } from '@/constants/appSettings';

export type AppSettings = {
  id: number;
  kakaotalk_pay_link: string;
  updated_at: string;
};

const FALLBACK_SETTINGS: AppSettings = {
  id: 1,
  kakaotalk_pay_link: KAKAOTALK_PAY_LINK_FALLBACK,
  updated_at: new Date().toISOString(),
};

export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const { data, error } = await supabase.rpc('get_app_settings');
    if (!error && data) {
      return normalizeSettingsRow(data as AppSettings);
    }
  } catch {
    // RPC 미배포 시 테이블 직접 조회로 폴백
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('id, kakaotalk_pay_link, updated_at')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      return normalizeSettingsRow(data as AppSettings);
    }
  } catch {
    // ignore
  }

  return FALLBACK_SETTINGS;
}

function normalizeSettingsRow(row: AppSettings): AppSettings {
  const link = row.kakaotalk_pay_link?.trim();
  if (!link) {
    return { ...row, kakaotalk_pay_link: KAKAOTALK_PAY_LINK_FALLBACK };
  }
  return { ...row, kakaotalk_pay_link: link };
}

export function subscribeAppSettings(onChange: () => void): () => void {
  const channel = supabase
    .channel('app_settings_mobile')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => onChange())
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
