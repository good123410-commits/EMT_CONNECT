import type { EmergencyBedItem } from '@/services/emergencyApi';

export type EquipmentSpecItem = {
  key: string;
  label: string;
  shortLabel: string;
  available: boolean;
  icon: 'scan' | 'magnet' | 'pulse' | 'car' | 'fitness' | 'baby';
};

export type IcuBedSpecItem = {
  key: string;
  label: string;
  count: number;
};

export type DutyContactItem = {
  key: 'er' | 'pediatric';
  label: string;
  phone: string;
};

export type EmergencyHospitalSpecs = {
  equipment: EquipmentSpecItem[];
  icuBeds: IcuBedSpecItem[];
  pediatricEquipment: EquipmentSpecItem[];
  dutyContacts: DutyContactItem[];
};

function normalizePhone(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === '-') return '';
  return trimmed;
}

export function resolveErDutyPhone(item: Pick<EmergencyBedItem, 'erDoctorPhone' | 'erPhone'>): string {
  return normalizePhone(item.erDoctorPhone) || normalizePhone(item.erPhone);
}

export function resolvePediatricDutyPhone(
  item: Pick<EmergencyBedItem, 'pediatricDoctorPhone'>,
): string {
  return normalizePhone(item.pediatricDoctorPhone);
}

export function buildEmergencyHospitalSpecs(item: EmergencyBedItem): EmergencyHospitalSpecs {
  const equipment: EquipmentSpecItem[] = [
    {
      key: 'ct',
      label: 'CT',
      shortLabel: 'CT',
      available: item.ctAvailable,
      icon: 'scan',
    },
    {
      key: 'mri',
      label: 'MRI',
      shortLabel: 'MRI',
      available: item.mriAvailable,
      icon: 'magnet',
    },
    {
      key: 'angio',
      label: '조영촬영',
      shortLabel: '조영',
      available: item.angioAvailable,
      icon: 'pulse',
    },
    {
      key: 'venti',
      label: '인공호흡기',
      shortLabel: 'VENTI',
      available: item.ventilatorAvailable,
      icon: 'fitness',
    },
    {
      key: 'ambulance',
      label: '구급차',
      shortLabel: '구급차',
      available: item.ambulanceAvailable,
      icon: 'car',
    },
  ];

  const icuBeds: IcuBedSpecItem[] = [
    { key: 'hv2', label: '내과중환자', count: item.icuInternalMedicineBeds },
    { key: 'hv3', label: '외과중환자', count: item.icuSurgeryBeds },
    { key: 'hv4', label: '정형외과입원', count: item.icuOrthopedicBeds },
    { key: 'hv5', label: '신경과입원', count: item.icuNeurologyBeds },
    { key: 'hv6', label: '신경외과중환자', count: item.icuNeurosurgeryBeds },
    { key: 'hv7', label: '약물중환자', count: item.icuToxicologyBeds },
    { key: 'hv8', label: '화상중환자', count: item.icuBurnBeds },
    { key: 'hv9', label: '외상중환자', count: item.icuTraumaBeds },
  ].filter((row) => row.count > 0);

  const pediatricEquipment: EquipmentSpecItem[] = [
    {
      key: 'hv10',
      label: '소아 인공호흡기',
      shortLabel: '소아VENTI',
      available: item.pediatricVentilatorAvailable,
      icon: 'fitness',
    },
    {
      key: 'hv11',
      label: '인큐베이터',
      shortLabel: '인큐베이터',
      available: item.incubatorAvailable,
      icon: 'baby',
    },
  ];

  const dutyContacts: DutyContactItem[] = [];
  const erDutyPhone = resolveErDutyPhone(item);
  const pediatricDutyPhone = resolvePediatricDutyPhone(item);

  if (erDutyPhone) {
    dutyContacts.push({ key: 'er', label: '응급실 당직의', phone: erDutyPhone });
  }
  if (pediatricDutyPhone) {
    dutyContacts.push({ key: 'pediatric', label: '소아 당직의', phone: pediatricDutyPhone });
  }

  return {
    equipment,
    icuBeds,
    pediatricEquipment,
    dutyContacts,
  };
}

export function hasEmergencyHospitalSpecs(specs: EmergencyHospitalSpecs | null | undefined): boolean {
  if (!specs) return false;
  return (
    specs.equipment.some((item) => item.available) ||
    specs.icuBeds.length > 0 ||
    specs.pediatricEquipment.some((item) => item.available) ||
    specs.dutyContacts.length > 0
  );
}
