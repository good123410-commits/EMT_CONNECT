import type { EmergencyTickerItem } from '@/types/emergencyTicker';

export const EMERGENCY_TICKER_DEBUG = __DEV__;

export type TickerSourceCounts = Record<string, number>;

export function countBySource(items: EmergencyTickerItem[]): TickerSourceCounts {
  const counts: TickerSourceCounts = {};
  for (const item of items) {
    const key = item.sourceType || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function logTickerStage(stage: string, payload: unknown): void {
  if (!EMERGENCY_TICKER_DEBUG) return;
  console.log(`[EmergencyTicker:${stage}]`, payload);
}

export function logTickerPipeline(
  stage: string,
  before: EmergencyTickerItem[],
  after: EmergencyTickerItem[],
  detail?: Record<string, unknown>,
): void {
  if (!EMERGENCY_TICKER_DEBUG) return;

  const removed = before.length - after.length;
  console.log(`[EmergencyTicker:pipeline:${stage}]`, {
    before: before.length,
    after: after.length,
    removed,
    beforeBySource: countBySource(before),
    afterBySource: countBySource(after),
    droppedSamples:
      removed > 0
        ? before
            .filter(
              (item) =>
                !after.some(
                  (kept) =>
                    kept.sourceType === item.sourceType && kept.message === item.message,
                ),
            )
            .slice(0, 5)
            .map((item) => ({
              sourceType: item.sourceType,
              message: item.message.slice(0, 80),
            }))
        : [],
    ...detail,
  });
}

export type DisasterCacheDiagnosticRow = {
  sourceCode: string;
  messageCount: number;
  fetchedAt: string | null;
  expiresAt: string;
  isExpired: boolean;
  sampleMessages: string[];
};

export function logTickerFetchSummary(input: {
  rpcItems: EmergencyTickerItem[];
  adminItems: EmergencyTickerItem[];
  cacheItems: EmergencyTickerItem[];
  cacheRows: Array<{
    source_code: string;
    messages: unknown;
    expires_at: string;
    fetched_at?: string;
  }>;
}): void {
  if (!EMERGENCY_TICKER_DEBUG) return;

  const nowIso = new Date().toISOString();
  const cacheDiagnostics: DisasterCacheDiagnosticRow[] = input.cacheRows.map((row) => {
    const messages = Array.isArray(row.messages)
      ? row.messages.map((value) => String(value ?? '').trim()).filter(Boolean)
      : [];
    return {
      sourceCode: row.source_code,
      messageCount: messages.length,
      fetchedAt: row.fetched_at ?? null,
      expiresAt: row.expires_at,
      isExpired: row.expires_at <= nowIso,
      sampleMessages: messages.slice(0, 2).map((message) => message.slice(0, 100)),
    };
  });

  console.log('[EmergencyTicker:fetch:summary]', {
    rpc: {
      total: input.rpcItems.length,
      bySource: countBySource(input.rpcItems),
      samples: input.rpcItems.slice(0, 3).map((item) => ({
        sourceType: item.sourceType,
        sortOrder: item.sortOrder,
        message: item.message.slice(0, 80),
      })),
    },
    adminDirect: {
      total: input.adminItems.length,
      bySource: countBySource(input.adminItems),
    },
    cacheDirect: {
      total: input.cacheItems.length,
      bySource: countBySource(input.cacheItems),
      samples: input.cacheItems.slice(0, 3).map((item) => ({
        sourceType: item.sourceType,
        message: item.message.slice(0, 80),
      })),
    },
    cacheTable: cacheDiagnostics,
    path:
      input.rpcItems.length > 0
        ? 'rpc'
        : input.adminItems.length > 0 || input.cacheItems.length > 0
          ? 'fallback:admin+cache'
          : 'empty',
  });
}
