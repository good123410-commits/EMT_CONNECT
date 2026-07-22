export type HospitalDutyDay = {
  dayCode: number;
  dayLabel: string;
  start: string;
  end: string;
  closed: boolean;
};

export const DUTY_DAY_LABELS: Record<number, string> = {
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
  7: '일',
  8: '공휴',
};

export const DUTY_DAY_FULL_LABELS: Record<number, string> = {
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
  7: '일요일',
  8: '공휴일',
};

/** 월=1 … 일=7, 토=6 (공공 API QT 코드와 동일) */
export function getTreatmentDayCode(date = new Date()): number {
  const day = date.getDay();
  if (day === 0) return 7;
  if (day === 6) return 6;
  return day;
}

export function formatDutyTimeRaw(raw: string | null | undefined): string {
  if (!raw?.trim() || raw.includes('휴무')) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return raw.trim();
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function parseWeeklyDutySchedule(
  fields: Record<string, string | undefined>,
): HospitalDutyDay[] {
  const schedule: HospitalDutyDay[] = [];

  for (let dayCode = 1; dayCode <= 8; dayCode += 1) {
    const start = formatDutyTimeRaw(fields[`dutyTime${dayCode}s`]);
    const end = formatDutyTimeRaw(fields[`dutyTime${dayCode}c`]);
    schedule.push({
      dayCode,
      dayLabel: DUTY_DAY_LABELS[dayCode] ?? `${dayCode}`,
      start,
      end,
      closed: !start && !end,
    });
  }

  return schedule;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

export function isDutyOpenNow(start: string, end: string, now = new Date()): boolean {
  if (!start || !end) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(start);
  const close = toMinutes(end);
  if (open < 0 || close < 0) return false;
  if (close <= open) return current >= open || current <= close;
  return current >= open && current <= close;
}

export function resolveHospitalOpenStatus(
  schedule: HospitalDutyDay[],
  now = new Date(),
): {
  isOpenNow: boolean;
  label: string;
  todaySchedule: HospitalDutyDay | null;
} {
  const dayCode = getTreatmentDayCode(now);
  const todaySchedule = schedule.find((item) => item.dayCode === dayCode) ?? null;

  if (!todaySchedule || todaySchedule.closed) {
    return { isOpenNow: false, label: '진료 마감', todaySchedule };
  }

  const open = isDutyOpenNow(todaySchedule.start, todaySchedule.end, now);
  return {
    isOpenNow: open,
    label: open ? '진료 중' : '진료 마감',
    todaySchedule,
  };
}

const DAY_LABEL_TO_CODE: Record<string, number> = {
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
  일: 7,
  공휴: 8,
  공휴일: 8,
};

/** 관리자 입력용 "월 09:00-18:00" 형식 파싱 */
export function parseOperatingHoursText(text: string): HospitalDutyDay[] {
  const schedule: HospitalDutyDay[] = [];
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const dayMatch = line.match(/^(월|화|수|목|금|토|일|공휴일?)\s+(.+)$/);
    if (!dayMatch) continue;

    const dayCode = DAY_LABEL_TO_CODE[dayMatch[1]] ?? 0;
    if (!dayCode) continue;

    const body = dayMatch[2].trim();
    if (body.includes('휴무')) {
      schedule.push({
        dayCode,
        dayLabel: DUTY_DAY_LABELS[dayCode] ?? `${dayCode}`,
        start: '',
        end: '',
        closed: true,
      });
      continue;
    }

    const timeMatch = body.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
    schedule.push({
      dayCode,
      dayLabel: DUTY_DAY_LABELS[dayCode] ?? `${dayCode}`,
      start: timeMatch?.[1] ?? '',
      end: timeMatch?.[2] ?? '',
      closed: !timeMatch,
    });
  }

  return schedule;
}

export function formatOperatingHoursText(schedule: HospitalDutyDay[]): string {
  if (!schedule.length) return '';
  return schedule
    .map((day) => {
      if (day.closed || (!day.start && !day.end)) {
        return `${day.dayLabel} 휴무`;
      }
      return `${day.dayLabel} ${day.start}-${day.end}`;
    })
    .join('\n');
}
