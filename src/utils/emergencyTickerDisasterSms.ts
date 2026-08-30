import type { EmergencyTickerItem } from '@/types/emergencyTicker';

const YMD_SEPARATED_RE = /(\d{4})[-./년\s](\d{1,2})[-./월\s](\d{1,2})/;
const YMD_COMPACT_RE = /(?:^|[^\d])(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(?:[^\d]|$)/;
const KOREAN_MD_RE = /(\d{1,2})월\s*(\d{1,2})일/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toKstDateKey(date: Date): string {
  // Hermes/Expo Go — Intl timeZone 미지원 환경 대비 (UTC+9 수동 계산)
  const kstMs = date.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  return `${kst.getUTCFullYear()}-${pad2(kst.getUTCMonth() + 1)}-${pad2(kst.getUTCDate())}`;
}

function buildDateKey(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** 재난문자 본문에서 발송일 추정 (없으면 null) */
export function extractDisasterSmsDateKey(message: string, referenceDate = new Date()): string | null {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const separated = text.match(YMD_SEPARATED_RE);
  if (separated) {
    return buildDateKey(
      Number(separated[1]),
      Number(separated[2]),
      Number(separated[3]),
    );
  }

  const compact = text.match(YMD_COMPACT_RE);
  if (compact) {
    return buildDateKey(
      Number(compact[1]),
      Number(compact[2]),
      Number(compact[3]),
    );
  }

  const korean = text.match(KOREAN_MD_RE);
  if (korean) {
    const referenceYear = Number(toKstDateKey(referenceDate).slice(0, 4));
    return buildDateKey(referenceYear, Number(korean[1]), Number(korean[2]));
  }

  return null;
}


/**
 * 재난문자는 당일(KST) 발송분만 유지합니다. admin / 기상 / 산불 항목은 그대로 유지합니다.
 */
export function applyDisasterSmsTodayFallback(
  items: EmergencyTickerItem[],
  referenceDate = new Date(),
): EmergencyTickerItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const todayKey = toKstDateKey(referenceDate);
  const nonSms = items.filter((item) => item.sourceType !== 'disaster_sms');
  const smsItems = items.filter((item) => item.sourceType === 'disaster_sms');

  if (smsItems.length === 0) {
    return nonSms;
  }

  const todaySms = smsItems.filter((item) => {
    const messageDateKey = extractDisasterSmsDateKey(item.message, referenceDate);
    return messageDateKey === todayKey;
  });

  const undatedSms = smsItems.filter(
    (item) => extractDisasterSmsDateKey(item.message, referenceDate) == null,
  );

  if (todaySms.length > 0) {
    const resolvedToday = mergeSmsItems(todaySms, undatedSms);
    return [...nonSms, ...resolvedToday].sort(compareTickerItems);
  }

  if (undatedSms.length > 0) {
    return [...nonSms, ...undatedSms].sort(compareTickerItems);
  }

  return nonSms;
}

function mergeSmsItems(primary: EmergencyTickerItem[], secondary: EmergencyTickerItem[]): EmergencyTickerItem[] {
  const seen = new Set<string>();
  const merged: EmergencyTickerItem[] = [];

  for (const item of [...primary, ...secondary]) {
    const key = `${item.sourceType}:${item.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

function compareTickerItems(left: EmergencyTickerItem, right: EmergencyTickerItem): number {
  if (left.priority !== right.priority) return left.priority - right.priority;
  return left.sortOrder - right.sortOrder;
}
