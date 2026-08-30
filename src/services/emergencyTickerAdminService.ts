import { supabase } from '@/lib/supabaseClient';
import type {
  EmergencyTickerDashboardItem,
  ReorderEmergencyTickerItemInput,
  UpsertEmergencyTickerItemSettingInput,
} from '@/types/emergencyTicker';

type DashboardRow = {
  item_key: string;
  source_type: string;
  original_message: string;
  display_message: string;
  is_active: boolean;
  sort_order: number;
  admin_notice_id: string | null;
  cache_source_code: string | null;
  cache_fetched_at: string | null;
  cache_expires_at: string | null;
  cache_is_expired: boolean;
  settings_updated_at: string | null;
};

export class EmergencyTickerAdminServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmergencyTickerAdminServiceError';
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

function mapDashboardRow(row: DashboardRow): EmergencyTickerDashboardItem {
  return {
    itemKey: row.item_key,
    sourceType: row.source_type,
    originalMessage: row.original_message,
    displayMessage: row.display_message,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    adminNoticeId: row.admin_notice_id,
    cacheSourceCode: row.cache_source_code,
    cacheFetchedAt: row.cache_fetched_at,
    cacheExpiresAt: row.cache_expires_at,
    cacheIsExpired: row.cache_is_expired,
    settingsUpdatedAt: row.settings_updated_at,
  };
}

export async function fetchEmergencyTickerDashboardItems(): Promise<EmergencyTickerDashboardItem[]> {
  const { data, error } = await supabase.rpc('admin_list_emergency_ticker_dashboard');

  if (error) {
    if (isMissingRpcError(error.message)) {
      throw new EmergencyTickerAdminServiceError(
        'admin_list_emergency_ticker_dashboard RPC가 없습니다. migration_v73_emergency_ticker_admin.sql을 적용해 주세요.',
      );
    }
    throw new EmergencyTickerAdminServiceError(error.message);
  }

  return ((data ?? []) as DashboardRow[]).map(mapDashboardRow);
}

export async function upsertEmergencyTickerItemSetting(
  input: UpsertEmergencyTickerItemSettingInput,
): Promise<void> {
  const { error } = await supabase.rpc('admin_upsert_emergency_ticker_item_setting', {
    p_item_key: input.itemKey,
    p_source_type: input.sourceType,
    p_original_message: input.originalMessage,
    p_display_message: input.displayMessage ?? null,
    p_is_active: input.isActive ?? true,
    p_sort_order: input.sortOrder ?? null,
    p_admin_notice_id: input.adminNoticeId ?? null,
    p_cache_source_code: input.cacheSourceCode ?? null,
  });

  if (error) {
    throw new EmergencyTickerAdminServiceError(error.message);
  }
}

export async function reorderEmergencyTickerItems(
  items: ReorderEmergencyTickerItemInput[],
): Promise<void> {
  const payload = items.map((item) => ({
    item_key: item.itemKey,
    source_type: item.sourceType,
    original_message: item.originalMessage,
    sort_order: item.sortOrder,
    admin_notice_id: item.adminNoticeId ?? null,
    cache_source_code: item.cacheSourceCode ?? null,
  }));

  const { error } = await supabase.rpc('admin_reorder_emergency_ticker_items', {
    p_items: payload,
  });

  if (error) {
    throw new EmergencyTickerAdminServiceError(error.message);
  }
}

export async function hideEmergencyTickerCacheItem(
  item: EmergencyTickerDashboardItem,
): Promise<void> {
  await upsertEmergencyTickerItemSetting({
    itemKey: item.itemKey,
    sourceType: item.sourceType,
    originalMessage: item.originalMessage,
    displayMessage: item.displayMessage,
    isActive: false,
    sortOrder: item.sortOrder,
    cacheSourceCode: item.cacheSourceCode,
  });
}

export async function updateEmergencyTickerCacheMessage(
  item: EmergencyTickerDashboardItem,
  displayMessage: string,
): Promise<void> {
  await upsertEmergencyTickerItemSetting({
    itemKey: item.itemKey,
    sourceType: item.sourceType,
    originalMessage: item.originalMessage,
    displayMessage: displayMessage.trim(),
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    cacheSourceCode: item.cacheSourceCode,
  });
}

export async function toggleEmergencyTickerDashboardItem(
  item: EmergencyTickerDashboardItem,
  isActive: boolean,
): Promise<void> {
  if (item.sourceType === 'admin' && item.adminNoticeId) {
    const { error } = await supabase.rpc('admin_upsert_home_emergency_notice', {
      p_id: item.adminNoticeId,
      p_message: item.displayMessage,
      p_is_active: isActive,
      p_sort_order: item.sortOrder,
      p_expires_at: null,
    });
    if (error) {
      throw new EmergencyTickerAdminServiceError(error.message);
    }
    return;
  }

  await upsertEmergencyTickerItemSetting({
    itemKey: item.itemKey,
    sourceType: item.sourceType,
    originalMessage: item.originalMessage,
    displayMessage: item.displayMessage,
    isActive,
    sortOrder: item.sortOrder,
    cacheSourceCode: item.cacheSourceCode,
  });
}
