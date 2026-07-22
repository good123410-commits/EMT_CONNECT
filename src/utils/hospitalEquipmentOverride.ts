import type { EmergencyBedItem } from '@/services/emergencyApi';
import { parseBedCount, parseYesNo } from '@/services/emergencyApi';
import type { CustomHospitalRow } from '@/types/customHospital';

export type HospitalErOverride = Partial<
  Pick<
    EmergencyBedItem,
    | 'ctAvailable'
    | 'mriAvailable'
    | 'angioAvailable'
    | 'ventilatorAvailable'
    | 'ambulanceAvailable'
    | 'erDoctorPhone'
    | 'pediatricDoctorPhone'
    | 'icuInternalMedicineBeds'
    | 'icuSurgeryBeds'
    | 'icuOrthopedicBeds'
    | 'icuNeurologyBeds'
    | 'icuNeurosurgeryBeds'
    | 'icuToxicologyBeds'
    | 'icuBurnBeds'
    | 'icuTraumaBeds'
    | 'pediatricVentilatorAvailable'
    | 'incubatorAvailable'
  >
>;

import type { EmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';
import { buildEmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';

function readYn(value: string | null | undefined): boolean | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '-') return undefined;
  return parseYesNo(trimmed);
}

function readBed(value: number | null | undefined): number | undefined {
  if (value == null) return undefined;
  const count = parseBedCount(value);
  return count > 0 ? count : undefined;
}

export function mapCustomHospitalRowToErOverride(row: CustomHospitalRow): HospitalErOverride | null {
  const override: HospitalErOverride = {};

  const ct = readYn(row.hvctayn);
  if (ct !== undefined) override.ctAvailable = ct;
  const mri = readYn(row.hvmriayn);
  if (mri !== undefined) override.mriAvailable = mri;
  const angio = readYn(row.hvangioayn);
  if (angio !== undefined) override.angioAvailable = angio;
  const venti = readYn(row.hvventiayn);
  if (venti !== undefined) override.ventilatorAvailable = venti;
  const ambulance = readYn(row.hvamyn);
  if (ambulance !== undefined) override.ambulanceAvailable = ambulance;
  const hv10 = readYn(row.hv10);
  if (hv10 !== undefined) override.pediatricVentilatorAvailable = hv10;
  const hv11 = readYn(row.hv11);
  if (hv11 !== undefined) override.incubatorAvailable = hv11;

  if (row.hv120?.trim()) override.erDoctorPhone = row.hv120.trim();
  if (row.hv122?.trim()) override.pediatricDoctorPhone = row.hv122.trim();

  const hv2 = readBed(row.hv2);
  if (hv2 !== undefined) override.icuInternalMedicineBeds = hv2;
  const hv3 = readBed(row.hv3);
  if (hv3 !== undefined) override.icuSurgeryBeds = hv3;
  const hv4 = readBed(row.hv4);
  if (hv4 !== undefined) override.icuOrthopedicBeds = hv4;
  const hv5 = readBed(row.hv5);
  if (hv5 !== undefined) override.icuNeurologyBeds = hv5;
  const hv6 = readBed(row.hv6);
  if (hv6 !== undefined) override.icuNeurosurgeryBeds = hv6;
  const hv7 = readBed(row.hv7);
  if (hv7 !== undefined) override.icuToxicologyBeds = hv7;
  const hv8 = readBed(row.hv8);
  if (hv8 !== undefined) override.icuBurnBeds = hv8;
  const hv9 = readBed(row.hv9);
  if (hv9 !== undefined) override.icuTraumaBeds = hv9;

  return Object.keys(override).length > 0 ? override : null;
}

export function mergeEmergencyBedWithOverride(
  base: EmergencyBedItem,
  override: HospitalErOverride | null | undefined,
): EmergencyBedItem {
  if (!override) return base;
  return { ...base, ...override };
}

export function buildSpecsFromErOverride(
  override: HospitalErOverride,
): EmergencyHospitalSpecs {
  const emptyBase = {
    rnum: 0,
    hpid: '',
    phpid: '',
    hospitalName: '',
    erPhone: '',
    updatedAt: '',
    availableErBeds: 0,
    availablePediatricErBeds: 0,
    availableSurgeryBeds: 0,
    availableNeuroIcuBeds: 0,
    availableNeonatalIcuBeds: 0,
    availableChestIcuBeds: 0,
    availableGeneralIcuBeds: 0,
    availableInpatientBeds: 0,
    onCallDoctor: '',
    ctAvailable: false,
    mriAvailable: false,
    angioAvailable: false,
    ventilatorAvailable: false,
    ambulanceAvailable: false,
    erDoctorPhone: '',
    pediatricDoctorPhone: '',
    status: 'full' as const,
    icuInternalMedicineBeds: 0,
    icuSurgeryBeds: 0,
    icuOrthopedicBeds: 0,
    icuNeurologyBeds: 0,
    icuNeurosurgeryBeds: 0,
    icuToxicologyBeds: 0,
    icuBurnBeds: 0,
    icuTraumaBeds: 0,
    pediatricVentilatorAvailable: false,
    incubatorAvailable: false,
  };

  return buildEmergencyHospitalSpecs({ ...emptyBase, ...override });
}

export function mergeSpecsWithErOverride(
  specs: EmergencyHospitalSpecs | null | undefined,
  override: HospitalErOverride | null | undefined,
): EmergencyHospitalSpecs | null | undefined {
  if (!override) return specs;
  const base = specs ?? buildSpecsFromErOverride(override);

  const equipment = base.equipment.map((item) => {
    const keyMap: Record<string, keyof HospitalErOverride> = {
      ct: 'ctAvailable',
      mri: 'mriAvailable',
      angio: 'angioAvailable',
      venti: 'ventilatorAvailable',
      ambulance: 'ambulanceAvailable',
    };
    const field = keyMap[item.key];
    if (field && override[field] !== undefined) {
      return { ...item, available: Boolean(override[field]) };
    }
    return item;
  });

  const pediatricEquipment = base.pediatricEquipment.map((item) => {
    if (item.key === 'hv10' && override.pediatricVentilatorAvailable !== undefined) {
      return { ...item, available: override.pediatricVentilatorAvailable };
    }
    if (item.key === 'hv11' && override.incubatorAvailable !== undefined) {
      return { ...item, available: override.incubatorAvailable };
    }
    return item;
  });

  const dutyContacts = [...base.dutyContacts];
  if (override.erDoctorPhone) {
    const idx = dutyContacts.findIndex((c) => c.key === 'er');
    if (idx >= 0) dutyContacts[idx] = { ...dutyContacts[idx], phone: override.erDoctorPhone };
    else dutyContacts.unshift({ key: 'er', label: '응급실 당직의', phone: override.erDoctorPhone });
  }
  if (override.pediatricDoctorPhone) {
    const idx = dutyContacts.findIndex((c) => c.key === 'pediatric');
    if (idx >= 0) dutyContacts[idx] = { ...dutyContacts[idx], phone: override.pediatricDoctorPhone };
    else dutyContacts.push({ key: 'pediatric', label: '소아 당직의', phone: override.pediatricDoctorPhone });
  }

  const icuLabelMap: Array<{ key: string; field: keyof HospitalErOverride; label: string }> = [
    { key: 'hv2', field: 'icuInternalMedicineBeds', label: '내과중환자' },
    { key: 'hv3', field: 'icuSurgeryBeds', label: '외과중환자' },
    { key: 'hv4', field: 'icuOrthopedicBeds', label: '정형외과입원' },
    { key: 'hv5', field: 'icuNeurologyBeds', label: '신경과입원' },
    { key: 'hv6', field: 'icuNeurosurgeryBeds', label: '신경외과중환자' },
    { key: 'hv7', field: 'icuToxicologyBeds', label: '약물중환자' },
    { key: 'hv8', field: 'icuBurnBeds', label: '화상중환자' },
    { key: 'hv9', field: 'icuTraumaBeds', label: '외상중환자' },
  ];

  const icuBeds = [...base.icuBeds];
  for (const row of icuLabelMap) {
    const count = override[row.field];
    if (typeof count === 'number' && count > 0) {
      const idx = icuBeds.findIndex((item) => item.key === row.key);
      if (idx >= 0) icuBeds[idx] = { ...icuBeds[idx], count };
      else icuBeds.push({ key: row.key, label: row.label, count });
    }
  }

  return { equipment, pediatricEquipment, dutyContacts, icuBeds };
}
