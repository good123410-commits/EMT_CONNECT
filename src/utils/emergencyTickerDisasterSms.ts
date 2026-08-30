import type { EmergencyTickerItem } from '@/types/emergencyTicker';

const KST_TIME_ZONE = 'Asia/Seoul';

const YMD_SEPARATED_RE = /(\d{4})[-./년\s](\d{1,2})[-./월\s](\d{1,2})/;
const YMD_COMPACT_RE = /(?:^|[^\d])(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(?:[^\d]|$)/;
const KOREAN_MD_RE = /(\d{1,2})월\s*(\d{1,2})일/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toKstDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: KST_TIME_ZONE }).format(date);
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

function disasterSmsRecencyScore(message: string, sortOrder: number, referenceDate: Date): number {
  const dateKey = extractDisasterSmsDateKey(message, referenceDate);
  if (dateKey) {
    const compact = dateKey.replace(/-/g, '');
    return Number(compact) * 1000 + (1000 - sortOrder);
  }
  return 1000 - sortOrder;
}

function sortDisasterSmsByRecency(
  items: EmergencyTickerItem[],
  referenceDate: Date,
): EmergencyTickerItem[] {
  return [...items].sort((left, right) => {
    const rightScore = disasterSmsRecencyScore(right.message, right.sortOrder, referenceDate);
    const leftScore = disasterSmsRecencyScore(left.message, left.sortOrder, referenceDate);
    if (rightScore !== leftScore) return rightScore - leftScore;
    return left.sortOrder - right.sortOrder;
  });
}

/**
 * 오늘(KST) 재난문자가 없으면 가장 최근 발송 목록으로 대체합니다.
 * admin / 기상 / 산불 항목은 그대로 유지합니다.
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

  const resolvedSms = sortDisasterSmsByRecency(smsItems, referenceDate);
  return [...nonSms, ...resolvedSms].sort(compareTickerItems);
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
