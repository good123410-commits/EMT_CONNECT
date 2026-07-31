import {
  DEFAULT_DRUG_SLOT,
  type MedicationRegistration,
} from '@/types/medicationLog';
import { computeNextDueAt } from '@/utils/medicationTimer';
import { saveMedicationRegistration } from './medicationLogStorage';

/** 복용 기록 없이 다음 복용 타이머만 즉시 가동 */
export async function activateMedicationTimer(
  registration: MedicationRegistration,
  medicationId: string,
): Promise<MedicationRegistration> {
  const med = registration.medications.find((item) => item.id === medicationId);
  if (!med) return registration;

  const startedAt = new Date().toISOString();
  const updated = {
    ...med,
    drugName: med.drugName.trim(),
    dosePerServing: med.dosePerServing.trim(),
    lastTakenAt: med.lastTakenAt ?? startedAt,
    nextDueAt: computeNextDueAt(startedAt, med.intervalHours),
  };

  const next: MedicationRegistration = {
    medications: registration.medications.map((item) =>
      item.id === medicationId ? updated : item,
    ),
  };

  await saveMedicationRegistration(next);
  return next;
}

/** 최소 입력으로 약물 등록 후 타이머 즉시 가동 */
export async function quickStartMedicationTimer(
  registration: MedicationRegistration,
  input: { drugName: string; dosePerServing: string; intervalHours: number },
  medicationId?: string,
): Promise<MedicationRegistration> {
  const startedAt = new Date().toISOString();
  let medications = [...registration.medications];
  if (medications.length === 0) {
    medications = [DEFAULT_DRUG_SLOT()];
  }

  const id = medicationId ?? medications[0].id;
  const next: MedicationRegistration = {
    medications: medications.map((item) =>
      item.id === id
        ? {
            ...item,
            drugName: input.drugName.trim(),
            dosePerServing: input.dosePerServing.trim(),
            intervalHours: input.intervalHours,
            lastTakenAt: startedAt,
            nextDueAt: computeNextDueAt(startedAt, input.intervalHours),
          }
        : item,
    ),
  };

  await saveMedicationRegistration(next);
  return next;
}
