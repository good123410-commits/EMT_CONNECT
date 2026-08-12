import rawMoonlightHospitals from '../../assets/data/generated/moonlight_hospitals_perfect.json';
import type { MoonlightHospital, MoonlightHospitalRecord } from '@/types/moonlightHospital';

const SOURCE = rawMoonlightHospitals as MoonlightHospitalRecord[];

function cleanHospitalName(name: string): string {
  return name.replace(/\s*진료중\s*$/u, '').trim();
}

function buildHospitalId(name: string, address: string, index: number): string {
  return `moonlight-${index}-${name}-${address}`.replace(/\s+/g, '-');
}

function normalizeSearchText(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function toMoonlightHospital(record: MoonlightHospitalRecord, index: number): MoonlightHospital {
  const displayName = cleanHospitalName(record.name);

  return {
    id: buildHospitalId(displayName, record.address, index),
    name: record.name,
    displayName,
    address: record.address.trim(),
    phone: record.phone.trim(),
    operatingHours: record.operating_hours ?? {},
  };
}

const ALL_MOONLIGHT_HOSPITALS: MoonlightHospital[] = SOURCE.map(toMoonlightHospital);

export function getAllMoonlightHospitals(): MoonlightHospital[] {
  return ALL_MOONLIGHT_HOSPITALS;
}

export function searchMoonlightHospitals(query: string): MoonlightHospital[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) return ALL_MOONLIGHT_HOSPITALS;

  return ALL_MOONLIGHT_HOSPITALS.filter((hospital) => {
    const nameKey = normalizeSearchText(hospital.displayName);
    const addressKey = normalizeSearchText(hospital.address);
    return nameKey.includes(normalizedQuery) || addressKey.includes(normalizedQuery);
  });
}
