import type { EmergencyTickerItem } from '@/types/emergencyTicker';
import { pad2, toKstDateKey } from '@/utils/emergencyTickerDisasterSms';

const YMD_TIME_SEPARATED_RE =
  /(\d{4})[-./년\s](\d{1,2})[-./월\s](\d{1,2})일?\s*(?:[(\[]?\s*)?(\d{1,2})[:시hH](\d{1,2})(?:[:분](\d{1,2}))?(?:초)?/;
const YMD_COMPACT_WITH_TIME_RE = /(?:^|[^\d])(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:[^\d]|$)/;
const YMD_SEPARATED_RE = /(\d{4})[-./년\s](\d{1,2})[-./월\s](\d{1,2})/;
const KOREAN_MD_TIME_RE =
  /(\d{1,2})월\s*(\d{1,2})일(?:\s*[(\[]?\s*)?(\d{1,2})[:시hH](\d{1,2})(?:[:분](\d{1,2}))?(?:초)?/;

function buildKstDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date | null {
  if (year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  if (second < 0 || second > 59) return null;

  const utcMs = Date.UTC(year, month - 1, day, hour - 9, minute, second);
  return new Date(utcMs);
}

/** 재난문자·특보 본문에서 발송·발표 시각 추정 */
export function extractTickerMessageDateTime(
  message: string,
  referenceDate = new Date(),
): Date | null {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  const separatedWithTime = text.match(YMD_TIME_SEPARATED_RE);
  if (separatedWithTime) {
    return buildKstDate(
      Number(separatedWithTime[1]),
      Number(separatedWithTime[2]),
      Number(separatedWithTime[3]),
      Number(separatedWithTime[4]),
      Number(separatedWithTime[5]),
      separatedWithTime[6] ? Number(separatedWithTime[6]) : 0,
    );
  }

  const compactWithTime = text.match(YMD_COMPACT_WITH_TIME_RE);
  if (compactWithTime) {
    return buildKstDate(
      Number(compactWithTime[1]),
      Number(compactWithTime[2]),
      Number(compactWithTime[3]),
      Number(compactWithTime[4]),
      Number(compactWithTime[5]),
      Number(compactWithTime[6]),
    );
  }

  const koreanWithTime = text.match(KOREAN_MD_TIME_RE);
  if (koreanWithTime) {
    const referenceYear = Number(toKstDateKey(referenceDate).slice(0, 4));
    return buildKstDate(
      referenceYear,
      Number(koreanWithTime[1]),
      Number(koreanWithTime[2]),
      Number(koreanWithTime[3]),
      Number(koreanWithTime[4]),
      koreanWithTime[5] ? Number(koreanWithTime[5]) : 0,
    );
  }

  const dateOnly = text.match(YMD_SEPARATED_RE);
  if (dateOnly) {
    return buildKstDate(Number(dateOnly[1]), Number(dateOnly[2]), Number(dateOnly[3]), 0, 0, 0);
  }

  return null;
}

export function formatTickerTimestampKst(value: string | Date | null | undefined): string | null {
  if (value == null || value === '') return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const kstMs = date.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  return `${kst.getUTCFullYear()}-${pad2(kst.getUTCMonth() + 1)}-${pad2(kst.getUTCDate())} ${pad2(kst.getUTCHours())}:${pad2(kst.getUTCMinutes())}:${pad2(kst.getUTCSeconds())}`;
}

export function resolveTickerOccurredAtLabel(
  item: EmergencyTickerItem,
  referenceDate = new Date(),
): string | null {
  const fromMessage = extractTickerMessageDateTime(item.message, referenceDate);
  if (fromMessage) {
    return formatTickerTimestampKst(fromMessage);
  }
  if (item.occurredAt) {
    return formatTickerTimestampKst(item.occurredAt);
  }
  return null;
}
