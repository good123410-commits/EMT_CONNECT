import { supabase } from '@/lib/supabaseClient';
import type { EmergencyTickerItem, EmergencyTickerSource } from '@/types/emergencyTicker';

export const EMERGENCY_NOTICES_TABLE = 'kemix_home_emergency_notices';
const DISASTER_CACHE_TABLE = 'kemix_disaster_ticker_cache';

const SOURCE_PRIORITY: Record<string, number> = {
  admin: 0,
  weather: 100,
  forest_fire: 200,
  disaster_sms: 300,
};

type TickerRow = {
  message?: string | null;
  source_type?: string | null;
  sourceType?: string | null;
  priority?: number | null;
  sort_order?: number | null;
  sortOrder?: number | null;
};

type EmergencyNoticeRow = {
  message: string;
  sort_order: number;
  expires_at: string | null;
  is_active: boolean;
};

type DisasterCacheRow = {
  source_code: string;
  messages: unknown;
  expires_at: string;
};

export class EmergencyTickerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmergencyTickerServiceError';
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

function normalizeSourceType(value: unknown): EmergencyTickerSource {
  const sourceType = String(value ?? 'admin').trim();
  return sourceType || 'admin';
}

function mapTickerRow(row: TickerRow): EmergencyTickerItem | null {
  const message = String(row.message ?? '').trim();
  if (!message) return null;

  const sourceType = normalizeSourceType(row.source_type ?? row.sourceType);
  return {
    message,
    sourceType,
    priority: Number(row.priority ?? SOURCE_PRIORITY[sourceType] ?? 400),
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
  };
}

function mergeTickerItems(groups: EmergencyTickerItem[][]): EmergencyTickerItem[] {
  const seen = new Set<string>();
  const merged: EmergencyTickerItem[] = [];

  for (const group of groups) {
    for (const item of group) {
      const message = item.message.trim();
      if (!message) continue;
      const dedupeKey = `${item.sourceType}:${message}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      merged.push({
        ...item,
        message,
      });
    }
  }

  return merged.sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority;
    return left.sortOrder - right.sortOrder;
  });
}

async function fetchViaRpc(): Promise<EmergencyTickerItem[]> {
  const { data, error } = await supabase.rpc('list_active_emergency_ticker_messages');

  if (error) {
    if (isMissingRpcError(error.message)) {
      return [];
    }
    throw new EmergencyTickerServiceError(error.message);
  }

  return ((data ?? []) as TickerRow[])
    .map((row) => mapTickerRow(row))
    .filter((item): item is EmergencyTickerItem => item !== null);
}

async function fetchAdminNoticesDirect(): Promise<EmergencyTickerItem[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from(EMERGENCY_NOTICES_TABLE)
    .select('message, sort_order, expires_at, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as EmergencyNoticeRow[])
    .filter((row) => {
      const message = row.message?.trim();
      if (!message) return false;
      if (row.expires_at && row.expires_at <= nowIso) return false;
      return true;
    })
    .map((row, index) => ({
      message: row.message.trim(),
      sourceType: 'admin' as const,
      priority: SOURCE_PRIORITY.admin,
      sortOrder: row.sort_order ?? index,
    }));
}

function parseCacheMessages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

async function fetchDisasterCacheDirect(): Promise<EmergencyTickerItem[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from(DISASTER_CACHE_TABLE)
    .select('source_code, messages, expires_at')
    .gt('expires_at', nowIso);

  if (error) {
    return [];
  }

  const items: EmergencyTickerItem[] = [];
  for (const row of (data ?? []) as DisasterCacheRow[]) {
    const sourceType = normalizeSourceType(row.source_code);
    const priority = SOURCE_PRIORITY[sourceType] ?? 400;
    const messages = parseCacheMessages(row.messages);

    messages.forEach((message, index) => {
      items.push({
        message,
        sourceType,
        priority,
        sortOrder: index,
      });
    });
  }

  return items;
}

export async function fetchActiveEmergencyTickerItems(): Promise<EmergencyTickerItem[]> {
  const [rpcItems, adminItems, cacheItems] = await Promise.all([
    fetchViaRpc().catch(() => [] as EmergencyTickerItem[]),
    fetchAdminNoticesDirect(),
    fetchDisasterCacheDirect(),
  ]);

  return mergeTickerItems([rpcItems, adminItems, cacheItems]);
}
