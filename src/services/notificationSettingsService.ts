import { supabase } from '@/lib/supabaseClient';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingsPatch,
  type UserNotificationSettings,
} from '@/types/notificationSettings';

function mapSettingsRow(row: Record<string, unknown>): UserNotificationSettings {
  return {
    push_enabled_posts: row.push_enabled_posts !== false,
    push_enabled_comments: row.push_enabled_comments !== false,
    push_enabled_chats: row.push_enabled_chats !== false,
    expo_push_token:
      typeof row.expo_push_token === 'string' && row.expo_push_token.trim()
        ? row.expo_push_token.trim()
        : null,
  };
}

export async function fetchMyNotificationSettings(): Promise<UserNotificationSettings> {
  const { data, error } = await supabase.rpc('get_my_notification_settings');
  if (error) {
    if (__DEV__) {
      console.warn('[notificationSettings] fetch failed', error.message);
    }
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
  return mapSettingsRow((data ?? {}) as Record<string, unknown>);
}

export async function updateMyNotificationSettings(
  patch: NotificationSettingsPatch,
): Promise<UserNotificationSettings> {
  const { data, error } = await supabase.rpc('upsert_my_notification_settings', {
    p_push_enabled_posts: patch.push_enabled_posts ?? null,
    p_push_enabled_comments: patch.push_enabled_comments ?? null,
    p_push_enabled_chats: patch.push_enabled_chats ?? null,
    p_expo_push_token: patch.expo_push_token ?? null,
  });
  if (error) throw error;
  return mapSettingsRow((data ?? {}) as Record<string, unknown>);
}
