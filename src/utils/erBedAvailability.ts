import type { ErStatus } from '@/mockData/aedAndEmergency';
import { safeErStatus } from '@/services/emergencyApi';
import type { ErLiveSnapshot } from '@/services/hybridErService';

export type ErBedAvailability = {
  availableErBeds: number;
  availablePediatricErBeds: number;
  status: ErStatus;
  fillPercent: number;
  label: string;
  hasLiveData: boolean;
  isEmpty: boolean;
};

export function computeErBedAvailability(
  snapshot: ErLiveSnapshot | null | undefined,
  options?: { hasError?: boolean },
): ErBedAvailability {
  if (!snapshot || options?.hasError) {
    return {
      availableErBeds: 0,
      availablePediatricErBeds: 0,
      status: 'congested',
      fillPercent: 0,
      label: options?.hasError ? '조회 불가' : '확인중',
      hasLiveData: false,
      isEmpty: true,
    };
  }

  const availableErBeds = Number.isFinite(snapshot.availableErBeds) ? snapshot.availableErBeds : 0;
  const availablePediatricErBeds = Number.isFinite(snapshot.availablePediatricErBeds)
    ? snapshot.availablePediatricErBeds
    : 0;
  const status = safeErStatus(snapshot.status);

  const fillPercent =
    status === 'full'
      ? 100
      : status === 'congested'
        ? 72
        : Math.min(availableErBeds * 12, 100);

  return {
    availableErBeds,
    availablePediatricErBeds,
    status,
    fillPercent,
    label: status === 'available' ? '여유' : status === 'congested' ? '혼잡' : '포화',
    hasLiveData: true,
    isEmpty: availableErBeds <= 0,
  };
}
