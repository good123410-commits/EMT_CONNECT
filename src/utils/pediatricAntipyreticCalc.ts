export type AntipyreticDrugFamily = 'acetaminophen' | 'nsaid';

export type AntipyreticDrugId = 'acetaminophen' | 'ibuprofen' | 'dexibuprofen';

export type AntipyreticDrugOption = {
  id: AntipyreticDrugId;
  label: string;
  family: AntipyreticDrugFamily;
  minAgeLabel: string;
  mgPerKgMin: number;
  mgPerKgMax: number;
  concentrationMgPerMl: number;
  intervalLabel: string;
  minIntervalHours: number;
  maxDailyDoses: number;
  guideSummary: string;
};

export type AntipyreticFamilyOption = {
  id: AntipyreticDrugFamily;
  label: string;
  subtitle: string;
  representativeDrugId: AntipyreticDrugId;
};

export const CROSS_DOSE_MIN_HOURS = 2;

export const ANTIPYRETIC_FAMILY_OPTIONS: AntipyreticFamilyOption[] = [
  {
    id: 'acetaminophen',
    label: '아세트아미노펜 계열',
    subtitle: '타이레놀 등 · 4~6시간',
    representativeDrugId: 'acetaminophen',
  },
  {
    id: 'nsaid',
    label: '부루펜 계열',
    subtitle: '이부·덱시부프로펜 · 6~8시간',
    representativeDrugId: 'ibuprofen',
  },
];

export const ANTIPYRETIC_GUIDE_ITEMS = [
  {
    title: '아세트아미노펜',
    body: '4개월 이상 · 체중당 10~15mg · 4~6시간 간격 (위장 부담 적음)',
  },
  {
    title: '이부·덱시부프로펜',
    body: '6개월 이상 · 소염 효과 · 6~8시간 간격',
  },
  {
    title: '교차 복용',
    body: '다른 성분 간 최소 2시간 이상 간격 필수 (동일 계열 교차 불가)',
  },
  {
    title: '주의',
    body: '나이가 아닌 정확한 체중 기준 계산, 종합감기약 중복 성분 확인',
  },
] as const;

export const ANTIPYRETIC_DRUGS: AntipyreticDrugOption[] = [
  {
    id: 'acetaminophen',
    label: '아세트아미노펜',
    family: 'acetaminophen',
    minAgeLabel: '4개월 이상',
    mgPerKgMin: 10,
    mgPerKgMax: 15,
    concentrationMgPerMl: 32,
    intervalLabel: '4~6시간',
    minIntervalHours: 4,
    maxDailyDoses: 5,
    guideSummary: '체중당 10~15mg, 4~6시간 간격',
  },
  {
    id: 'ibuprofen',
    label: '이부프로펜',
    family: 'nsaid',
    minAgeLabel: '6개월 이상',
    mgPerKgMin: 5,
    mgPerKgMax: 10,
    concentrationMgPerMl: 20,
    intervalLabel: '6~8시간',
    minIntervalHours: 6,
    maxDailyDoses: 3,
    guideSummary: '체중당 5~10mg, 6~8시간 간격',
  },
  {
    id: 'dexibuprofen',
    label: '덱시부프로펜',
    family: 'nsaid',
    minAgeLabel: '6개월 이상',
    mgPerKgMin: 5,
    mgPerKgMax: 10,
    concentrationMgPerMl: 20,
    intervalLabel: '6~8시간',
    minIntervalHours: 6,
    maxDailyDoses: 3,
    guideSummary: '체중당 5~10mg, 6~8시간 간격',
  },
];

export type PediatricAntipyreticResult = {
  drug: AntipyreticDrugOption;
  family: AntipyreticDrugFamily;
  weightKg: number;
  mgMin: number;
  mgMax: number;
  mlMin: number;
  mlMax: number;
};

export type AntipyreticDoseHistoryEntry = {
  id: string;
  family: AntipyreticDrugFamily;
  drugId: AntipyreticDrugId;
  takenAt: string;
};

export type AntipyreticFamilySchedule = {
  family: AntipyreticDrugFamily;
  lastDoseAt: Date | null;
  nextSameFamilyAt: Date | null;
  nextCrossDoseAt: Date | null;
  canTakeNow: boolean;
  sameFamilyBlocked: boolean;
  crossFamilyBlocked: boolean;
};

export type AntipyreticDoseValidationResult =
  | { ok: true }
  | { ok: false; reason: 'same_family' | 'cross_family'; message: string };

export function parseWeightKg(input: string): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function getAntipyreticDrug(id: AntipyreticDrugId | null): AntipyreticDrugOption | null {
  if (!id) return null;
  return ANTIPYRETIC_DRUGS.find((drug) => drug.id === id) ?? null;
}

export function getRepresentativeDrugId(family: AntipyreticDrugFamily): AntipyreticDrugId {
  const option = ANTIPYRETIC_FAMILY_OPTIONS.find((item) => item.id === family);
  return option?.representativeDrugId ?? 'acetaminophen';
}

export function getFamilyLabel(family: AntipyreticDrugFamily): string {
  const option = ANTIPYRETIC_FAMILY_OPTIONS.find((item) => item.id === family);
  return option?.label ?? family;
}

export function getOtherFamilyLabel(family: AntipyreticDrugFamily): string {
  return family === 'acetaminophen' ? '부루펜 계열' : '아세트아미노펜 계열';
}

export function calculatePediatricAntipyretic(
  weightKg: number,
  family: AntipyreticDrugFamily,
): PediatricAntipyreticResult | null {
  const drugId = getRepresentativeDrugId(family);
  const drug = getAntipyreticDrug(drugId);
  if (!drug || weightKg <= 0) return null;

  const mgMin = weightKg * drug.mgPerKgMin;
  const mgMax = weightKg * drug.mgPerKgMax;
  const mlMin = mgMin / drug.concentrationMgPerMl;
  const mlMax = mgMax / drug.concentrationMgPerMl;

  return {
    drug,
    family,
    weightKg,
    mgMin,
    mgMax,
    mlMin,
    mlMax,
  };
}

export function formatDoseMl(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatDoseMg(value: number): string {
  return String(Math.round(value));
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function parseDoseTimestamp(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function getLastFamilyDose(
  history: AntipyreticDoseHistoryEntry[],
  family: AntipyreticDrugFamily,
): AntipyreticDoseHistoryEntry | null {
  let latest: AntipyreticDoseHistoryEntry | null = null;
  for (const entry of history) {
    if (entry.family !== family) continue;
    if (!latest || entry.takenAt > latest.takenAt) {
      latest = entry;
    }
  }
  return latest;
}

export function getLastOtherFamilyDose(
  history: AntipyreticDoseHistoryEntry[],
  family: AntipyreticDrugFamily,
): AntipyreticDoseHistoryEntry | null {
  let latest: AntipyreticDoseHistoryEntry | null = null;
  for (const entry of history) {
    if (entry.family === family) continue;
    if (!latest || entry.takenAt > latest.takenAt) {
      latest = entry;
    }
  }
  return latest;
}

export function buildAntipyreticFamilySchedule(
  family: AntipyreticDrugFamily,
  history: AntipyreticDoseHistoryEntry[],
  referenceDate = new Date(),
): AntipyreticFamilySchedule | null {
  const drug = getAntipyreticDrug(getRepresentativeDrugId(family));
  if (!drug) return null;

  const now = referenceDate;
  const lastSame = getLastFamilyDose(history, family);
  const lastOther = getLastOtherFamilyDose(history, family);

  const lastDoseAt = lastSame ? parseDoseTimestamp(lastSame.takenAt) : null;
  const nextSameFamilyAt = lastDoseAt ? addHours(lastDoseAt, drug.minIntervalHours) : null;

  const lastOtherAt = lastOther ? parseDoseTimestamp(lastOther.takenAt) : null;
  const nextCrossDoseAt = lastOtherAt ? addHours(lastOtherAt, CROSS_DOSE_MIN_HOURS) : null;

  const sameFamilyBlocked = !!(nextSameFamilyAt && nextSameFamilyAt > now);
  const crossFamilyBlocked = !!(nextCrossDoseAt && nextCrossDoseAt > now);

  return {
    family,
    lastDoseAt,
    nextSameFamilyAt,
    nextCrossDoseAt,
    canTakeNow: !sameFamilyBlocked && !crossFamilyBlocked,
    sameFamilyBlocked,
    crossFamilyBlocked,
  };
}

export function validateAntipyreticDose(
  family: AntipyreticDrugFamily,
  history: AntipyreticDoseHistoryEntry[],
  referenceDate = new Date(),
): AntipyreticDoseValidationResult {
  const schedule = buildAntipyreticFamilySchedule(family, history, referenceDate);
  if (!schedule) {
    return { ok: true };
  }

  if (schedule.sameFamilyBlocked && schedule.nextSameFamilyAt) {
    return {
      ok: false,
      reason: 'same_family',
      message: `아직 투약할 시간이 아닙니다.\n동일 계열은 ${formatAntipyreticDateTime(schedule.nextSameFamilyAt)} 이후 가능합니다.`,
    };
  }

  if (schedule.crossFamilyBlocked && schedule.nextCrossDoseAt) {
    return {
      ok: false,
      reason: 'cross_family',
      message: `교차 복용은 ${getOtherFamilyLabel(family)} 투약 후 최소 2시간이 지나야 합니다.\n(${formatAntipyreticDateTime(schedule.nextCrossDoseAt)} 이후)`,
    };
  }

  return { ok: true };
}

export function formatAntipyreticDateTime(date: Date): string {
  return date.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return '복용 가능';
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}시간 ${String(minutes).padStart(2, '0')}분`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${String(seconds).padStart(2, '0')}초`;
  }
  return `${seconds}초`;
}

export function sortDoseHistoryNewestFirst(
  history: AntipyreticDoseHistoryEntry[],
): AntipyreticDoseHistoryEntry[] {
  return [...history].sort(
    (left, right) => new Date(right.takenAt).getTime() - new Date(left.takenAt).getTime(),
  );
}
