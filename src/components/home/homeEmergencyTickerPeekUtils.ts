import type { EmergencyTickerItem } from '@/types/emergencyTicker';
import { EMERGENCY_TICKER_SOURCE_LABELS } from '@/types/emergencyTicker';
import {
  compareEmergencyTickerItems,
  isJunkTickerMessage,
  normalizeTickerItems,
  sanitizeTickerMessage,
} from '@/utils/emergencyTickerDisplay';
import { resolveTickerOccurredAtLabel } from '@/utils/emergencyTickerTimestamp';

export type TickerPeekListRow = {
  id: string;
  sourceType: string;
  label: string;
  color: string;
  body: string;
  fullMessage: string;
  occurredAtLabel: string | null;
};

function resolveSourceLabel(sourceType: string): string {
  return EMERGENCY_TICKER_SOURCE_LABELS[sourceType] ?? '알림';
}

function resolveSourceColor(sourceType: string): string {
  switch (sourceType) {
    case 'weather':
      return '#60A5FA';
    case 'forest_fire':
      return '#F87171';
    case 'disaster_sms':
      return '#FACC15';
    case 'admin':
      return '#E2E8F0';
    default:
      return '#CBD5E1';
  }
}

export function buildPeekListItems(items: EmergencyTickerItem[]): TickerPeekListRow[] {
  const normalized = normalizeTickerItems(items).sort(compareEmergencyTickerItems);
  const seen = new Set<string>();
  const rows: TickerPeekListRow[] = [];

  for (const item of normalized) {
    const rawMessage = item.message.trim();
    if (!rawMessage) continue;

    const body = sanitizeTickerMessage(rawMessage);
    if (item.sourceType !== 'admin' && (!body || isJunkTickerMessage(body))) {
      continue;
    }

    const displayBody = body || rawMessage;
    const dedupeKey = `${item.sourceType}:${displayBody}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const label = item.sourceType === 'admin' ? resolveSourceLabel('admin') : resolveSourceLabel(item.sourceType);

    rows.push({
      id: dedupeKey,
      sourceType: item.sourceType,
      label,
      color: resolveSourceColor(item.sourceType),
      body: displayBody,
      fullMessage: rawMessage,
      occurredAtLabel: resolveTickerOccurredAtLabel(item),
    });
  }

  return rows;
}
