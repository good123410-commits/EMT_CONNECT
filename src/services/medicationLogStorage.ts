import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createMedicationId,
  DEFAULT_DRUG_SLOT,
  DEFAULT_REGISTRATION,
  type MedicationHistoryEntry,
  type MedicationLogStore,
  type MedicationRegistration,
  type MedicationDrugSlot,
} from '@/types/medicationLog';
import { clampIntervalHours } from '@/utils/medicationTimer';

const STORAGE_KEY = 'kemix_medication_log_v2';
const LEGACY_KEY = 'kemix_medication_log_v1';

const EMPTY_STORE: MedicationLogStore = {
  registration: null,
  history: [],
};

type LegacyRegistration = {
  drugName?: string;
  dosePerServing?: string;
  photoUri?: string | null;
  intervalHours?: number;
  crossAlternate?: boolean;
  lastTakenAt?: string | null;
  nextDueAt?: string | null;
  primary?: Omit<MedicationDrugSlot, 'id'> & { id?: string };
  alternate?: (Omit<MedicationDrugSlot, 'id'> & { id?: string }) | null;
  medications?: Array<Omit<MedicationDrugSlot, 'id'> & { id?: string }>;
};

function normalizeDrugSlot(
  raw: Omit<MedicationDrugSlot, 'id'> & { id?: string },
  fallbackId?: string,
): MedicationDrugSlot {
  return {
    ...DEFAULT_DRUG_SLOT(),
    ...raw,
    id: raw.id ?? fallbackId ?? createMedicationId(),
    intervalHours: clampIntervalHours(raw.intervalHours),
  };
}

function migrateRegistration(raw: LegacyRegistration | null): MedicationRegistration | null {
  if (!raw) return null;

  if (Array.isArray(raw.medications) && raw.medications.length > 0) {
    return {
      medications: raw.medications.map((med) => normalizeDrugSlot(med)),
    };
  }

  if (raw.primary) {
    const medications: MedicationDrugSlot[] = [normalizeDrugSlot(raw.primary)];
    if (raw.crossAlternate && raw.alternate) {
      medications.push(normalizeDrugSlot(raw.alternate));
    }
    return { medications };
  }

  if (raw.drugName || raw.dosePerServing || raw.photoUri) {
    return {
      medications: [
        normalizeDrugSlot({
          drugName: raw.drugName ?? '',
          dosePerServing: raw.dosePerServing ?? '',
          photoUri: raw.photoUri ?? null,
          intervalHours: raw.intervalHours ?? 4,
          lastTakenAt: raw.lastTakenAt ?? null,
          nextDueAt: raw.nextDueAt ?? null,
        }),
      ],
    };
  }

  return DEFAULT_REGISTRATION();
}

export async function loadMedicationLogStore(): Promise<MedicationLogStore> {
  try {
    let raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = await AsyncStorage.getItem(LEGACY_KEY);
    }
    if (!raw) return { ...EMPTY_STORE, history: [] };

    const parsed = JSON.parse(raw) as MedicationLogStore & { registration?: LegacyRegistration };
    return {
      registration: migrateRegistration(parsed.registration ?? null),
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { ...EMPTY_STORE, history: [] };
  }
}

export async function saveMedicationLogStore(store: MedicationLogStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export async function saveMedicationRegistration(
  registration: MedicationRegistration,
): Promise<MedicationLogStore> {
  const store = await loadMedicationLogStore();
  const next: MedicationLogStore = {
    ...store,
    registration,
  };
  await saveMedicationLogStore(next);
  return next;
}

export async function appendMedicationHistory(
  entry: Omit<MedicationHistoryEntry, 'id'>,
): Promise<MedicationLogStore> {
  const store = await loadMedicationLogStore();
  const record: MedicationHistoryEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
  };
  const next: MedicationLogStore = {
    ...store,
    history: [record, ...store.history].slice(0, 200),
  };
  await saveMedicationLogStore(next);
  return next;
}

export async function deleteMedicationHistoryEntry(entryId: string): Promise<MedicationLogStore> {
  const store = await loadMedicationLogStore();
  const next: MedicationLogStore = {
    ...store,
    history: store.history.filter((entry) => entry.id !== entryId),
  };
  await saveMedicationLogStore(next);
  return next;
}

export { DEFAULT_DRUG_SLOT, DEFAULT_REGISTRATION } from '@/types/medicationLog';
