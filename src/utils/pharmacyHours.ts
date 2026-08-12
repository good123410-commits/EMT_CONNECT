import type { LocalPharmacyRecord } from '@/types/localFacility';

export const PHARMACY_DAY_LABELS: Record<number, string> = {
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
  7: '일요일',
  8: '공휴일',
};

/** 월=1 … 토=6, 일=7 (공공데이터 dayCode 규칙) */
export function getTreatmentDayCode(date = new Date()): number {
  const day = date.getDay();
  if (day === 0) return 7;
  if (day === 6) return 6;
  return day;
}

function padTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseDutyRange(raw: string | undefined): { start: string; end: string } | null {
  if (!raw?.trim() || raw.includes('휴무')) return null;

  const rangeMatch = raw.match(/(\d{1,2}:\d{2})\s*[~\-–]\s*(\d{1,2}:\d{2})/);
  if (rangeMatch) {
    return { start: rangeMatch[1], end: rangeMatch[2] };
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 8) {
    return {
      start: padTime(Number(digits.slice(0, 2)), Number(digits.slice(2, 4))),
      end: padTime(Number(digits.slice(4, 6)), Number(digits.slice(6, 8))),
    };
  }
  if (digits.length >= 4) {
    return {
      start: padTime(Number(digits.slice(0, 2)), Number(digits.slice(2, 4))),
      end: '',
    };
  }

  return null;
}

/** wh[0]=월 … wh[6]=일, wh[7]=공휴일 */
export function getPharmacyHoursForDay(
  weeklyHours: string[] | undefined,
  dayCode: number,
): { start: string; end: string } | null {
  if (!weeklyHours?.length) return null;
  const index = dayCode === 8 ? 7 : dayCode - 1;
  if (index < 0 || index >= weeklyHours.length) return null;
  return parseDutyRange(weeklyHours[index]);
}

export function isPharmacyOpenNow(start: string, end: string, now = new Date()): boolean {
  if (!start || !end) return false;

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const current = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(start);
  const close = toMinutes(end);

  if (close <= open) return current >= open || current <= close;
  return current >= open && current <= close;
}

export type PharmacyOpenStatus = {
  hasHours: boolean;
  isOpenNow: boolean;
  start: string;
  end: string;
  dayLabel: string;
  hoursLabel: string;
};

export function getPharmacyOpenStatus(
  record: Pick<LocalPharmacyRecord, 'wh'>,
  now = new Date(),
): PharmacyOpenStatus {
  const dayCode = getTreatmentDayCode(now);
  const hours = getPharmacyHoursForDay(record.wh, dayCode);

  if (!hours?.start || !hours.end) {
    return {
      hasHours: false,
      isOpenNow: false,
      start: '',
      end: '',
      dayLabel: PHARMACY_DAY_LABELS[dayCode] ?? '오늘',
      hoursLabel: '',
    };
  }

  return {
    hasHours: true,
    isOpenNow: isPharmacyOpenNow(hours.start, hours.end, now),
    start: hours.start,
    end: hours.end,
    dayLabel: PHARMACY_DAY_LABELS[dayCode] ?? '오늘',
    hoursLabel: `${hours.start}~${hours.end}`,
  };
}

export const PHARMACY_WEEKDAY_ORDER = [
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
  '일요일',
  '공휴일',
] as const;

/** 오늘 심야약국 지정 여부 — 오늘 요일에 운영시간 데이터가 있으면 true */
export function isTodayNightPharmacy(record: Pick<LocalPharmacyRecord, 'wh'>, now = new Date()): boolean {
  const dayCode = getTreatmentDayCode(now);
  const hours = getPharmacyHoursForDay(record.wh, dayCode);
  return Boolean(hours?.start || hours?.end);
}

export function buildPharmacyWeeklyRows(
  weeklyHours: string[] | undefined,
): Array<{ dayLabel: string; hours: string; isToday: boolean }> {
  const todayCode = getTreatmentDayCode();
  return PHARMACY_WEEKDAY_ORDER.map((dayLabel, index) => {
    const dayCode = index < 7 ? index + 1 : 8;
    const isToday = dayCode === todayCode;
    const raw = weeklyHours?.[index]?.trim() ?? '';
    const hours = !raw || raw.includes('휴무') ? '휴무' : raw;
    return { dayLabel, hours, isToday };
  });
}
