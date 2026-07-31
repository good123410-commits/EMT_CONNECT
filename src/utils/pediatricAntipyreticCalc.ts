export type AntipyreticDrugId = 'acetaminophen' | 'ibuprofen';

export type AntipyreticDrugOption = {
  id: AntipyreticDrugId;
  label: string;
  mgPerKgMin: number;
  mgPerKgMax: number;
  concentrationMgPerMl: number;
  intervalLabel: string;
  maxDailyDoses: number;
};

export const ANTIPYRETIC_DRUGS: AntipyreticDrugOption[] = [
  {
    id: 'acetaminophen',
    label: '아세트아미노펜',
    mgPerKgMin: 10,
    mgPerKgMax: 15,
    concentrationMgPerMl: 32,
    intervalLabel: '4~6시간',
    maxDailyDoses: 5,
  },
  {
    id: 'ibuprofen',
    label: '이부프로펜',
    mgPerKgMin: 5,
    mgPerKgMax: 10,
    concentrationMgPerMl: 20,
    intervalLabel: '6~8시간',
    maxDailyDoses: 3,
  },
];

export type PediatricAntipyreticResult = {
  drug: AntipyreticDrugOption;
  weightKg: number;
  mgMin: number;
  mgMax: number;
  mlMin: number;
  mlMax: number;
};

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

export function calculatePediatricAntipyretic(
  weightKg: number,
  drugId: AntipyreticDrugId,
): PediatricAntipyreticResult | null {
  const drug = getAntipyreticDrug(drugId);
  if (!drug || weightKg <= 0) return null;

  const mgMin = weightKg * drug.mgPerKgMin;
  const mgMax = weightKg * drug.mgPerKgMax;
  const mlMin = mgMin / drug.concentrationMgPerMl;
  const mlMax = mgMax / drug.concentrationMgPerMl;

  return {
    drug,
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
  const rounded = Math.round(value);
  return String(rounded);
}
