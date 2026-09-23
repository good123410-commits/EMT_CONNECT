import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AntipyreticDoseHistoryEntry,
  AntipyreticDrugFamily,
  AntipyreticDrugId,
} from '@/utils/pediatricAntipyreticCalc';

const HISTORY_KEY = 'kemix_pediatric_antipyretic_dose_history_v2';
const LEGACY_RECORDS_KEY = 'kemix_pediatric_antipyretic_dose_records_v1';

function isDrugId(value: string): value is AntipyreticDrugId {
  return value === 'acetaminophen' || value === 'ibuprofen' || value === 'dexibuprofen';
}

function isFamily(value: string): value is AntipyreticDrugFamily {
  return value === 'acetaminophen' || value === 'nsaid';
}

function normalizeHistory(raw: unknown): AntipyreticDoseHistoryEntry[] {
  if (!Array.isArray(raw)) return [];

  const entries: AntipyreticDoseHistoryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Partial<AntipyreticDoseHistoryEntry>;
    if (
      typeof record.id !== 'string' ||
      !isFamily(record.family) ||
      !isDrugId(record.drugId) ||
      typeof record.takenAt !== 'string' ||
      !record.takenAt.trim()
    ) {
      continue;
    }
    entries.push({
      id: record.id,
      family: record.family,
      drugId: record.drugId,
      takenAt: record.takenAt,
    });
  }

  return entries;
}

export async function loadAntipyreticDoseHistory(): Promise<AntipyreticDoseHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return normalizeHistory(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function appendAntipyreticDoseEntry(
  family: AntipyreticDrugFamily,
  drugId: AntipyreticDrugId,
  takenAt: Date,
): Promise<AntipyreticDoseHistoryEntry[]> {
  const current = await loadAntipyreticDoseHistory();
  const entry: AntipyreticDoseHistoryEntry = {
    id: `${takenAt.getTime()}-${Math.random().toString(36).slice(2, 9)}`,
    family,
    drugId,
    takenAt: takenAt.toISOString(),
  };
  const next = [entry, ...current];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearAntipyreticDoseHistory(): Promise<void> {
  await AsyncStorage.multiRemove([HISTORY_KEY, LEGACY_RECORDS_KEY]);
}
