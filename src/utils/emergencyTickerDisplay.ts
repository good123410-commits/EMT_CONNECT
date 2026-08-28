import type { EmergencyTickerItem, EmergencyTickerSource } from '@/types/emergencyTicker';

export type TickerDisplaySegment = {
  sourceType: EmergencyTickerSource;
  label: string;
  color: string;
  body: string;
  text: string;
};

const SOURCE_META: Record<
  'admin' | 'weather' | 'forest_fire' | 'disaster_sms',
  { label: string; color: string }
> = {
  admin: { label: '긴급공지', color: '#F8FAFC' },
  weather: { label: '기상특보', color: '#60A5FA' },
  forest_fire: { label: '산불안내', color: '#F87171' },
  disaster_sms: { label: '재난문자', color: '#FACC15' },
};

const SEGMENT_GAP = '   ···   ';

const DATE_ONLY_RE = /^(\d{4}[-./년]\d{1,2}[-./월]\d{1,2}일?|\d{8,14})$/;
const COORDINATE_RE = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

function resolveSourceMeta(sourceType: EmergencyTickerSource) {
  if (sourceType in SOURCE_META) {
    return SOURCE_META[sourceType as keyof typeof SOURCE_META];
  }
  return { label: '알림', color: '#F8FAFC' };
}

export function isJunkTickerMessage(message: string): boolean {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text) return true;
  if (text.length < 6) return true;
  if (DATE_ONLY_RE.test(text)) return true;
  if (COORDINATE_RE.test(text)) return true;
  if (/^[\d\s·.,:/-]+$/.test(text)) return true;
  return false;
}

export function sanitizeTickerMessage(message: string): string {
  let text = message.replace(/\s+/g, ' ').trim();

  text = text
    .replace(/(\d{4}[-./]\d{1,2}[-./]\d{1,2}(?:일)?\s*){2,}/g, ' ')
    .replace(/\s*·\s*\d{8,14}\s*$/g, '')
    .replace(/^\d{4}[-./]\d{1,2}[-./]\d{1,2}(?:일)?\s*·?\s*/g, '')
    .replace(/\s*·\s*·+/g, ' · ')
    .trim();

  return text;
}

export function buildTickerDisplaySegments(items: EmergencyTickerItem[]): TickerDisplaySegment[] {
  const seen = new Set<string>();

  return items
    .map((item) => {
      const meta = resolveSourceMeta(item.sourceType);
      const body = sanitizeTickerMessage(item.message);
      if (!body) return null;
      if (item.sourceType !== 'admin' && isJunkTickerMessage(body)) return null;

      const dedupeKey = `${item.sourceType}:${body}`;
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);

      const text = `(${meta.label}) ${body}`;
      return {
        sourceType: item.sourceType,
        label: meta.label,
        color: meta.color,
        body,
        text,
      };
    })
    .filter((segment): segment is TickerDisplaySegment => segment !== null);
}

export function joinTickerSegments(segments: TickerDisplaySegment[]): string {
  return segments.map((segment) => segment.text).join(SEGMENT_GAP);
}

export { SEGMENT_GAP };
