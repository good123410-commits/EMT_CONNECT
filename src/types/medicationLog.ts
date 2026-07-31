export function createMedicationId(): string {
  return `med_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export type MedicationDrugSlot = {
  id: string;
  drugName: string;
  dosePerServing: string;
  photoUri: string | null;
  /** 복용 간격 (시간, 1~48) */
  intervalHours: number;
  lastTakenAt: string | null;
  nextDueAt: string | null;
};

export type MedicationRegistration = {
  medications: MedicationDrugSlot[];
};

export type MedicationHistoryEntry = {
  id: string;
  medicationId?: string;
  drugName: string;
  dosePerServing: string;
  takenAt: string;
  /** @deprecated legacy primary/alternate */
  slot?: 'primary' | 'alternate';
};

export type MedicationLogStore = {
  registration: MedicationRegistration | null;
  history: MedicationHistoryEntry[];
};

export const DEFAULT_DRUG_SLOT = (): MedicationDrugSlot => ({
  id: createMedicationId(),
  drugName: '',
  dosePerServing: '',
  photoUri: null,
  intervalHours: 4,
  lastTakenAt: null,
  nextDueAt: null,
});

export const DEFAULT_REGISTRATION = (): MedicationRegistration => ({
  medications: [DEFAULT_DRUG_SLOT()],
});
