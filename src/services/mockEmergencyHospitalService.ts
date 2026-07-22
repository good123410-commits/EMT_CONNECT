import {
  findMockEmergencyHospital,
  filterMockEmergencyHospitals,
  type MockEmergencyHospital,
} from '@/mockData/emergencyHospitals';
import {
  calculateDistanceMeters,
  estimateWalkMinutes,
  type HospitalDetail,
  type HospitalMarkerShell,
} from '@/services/emergencyApi';
import type { GeoCoordinate } from '@/services/locationService';

function toMarkerShell(
  hospital: MockEmergencyHospital,
  coordinate: GeoCoordinate,
): HospitalMarkerShell {
  const distanceM = calculateDistanceMeters(coordinate, {
    latitude: hospital.latitude,
    longitude: hospital.longitude,
  });

  return {
    hpid: hospital.hpid,
    name: hospital.hospitalName,
    latitude: hospital.latitude,
    longitude: hospital.longitude,
    distanceM,
    walkMin: estimateWalkMinutes(distanceM),
    distanceKm: Number((distanceM / 1000).toFixed(1)) || 0,
    availableErBeds: hospital.availableBeds,
    availablePediatricErBeds: hospital.availablePediatricErBeds,
    status: hospital.status,
    isPediatricPriority: hospital.isPediatricPriority,
  };
}

export function getMockHospitalMarkerShells(coordinate: GeoCoordinate): HospitalMarkerShell[] {
  return filterMockEmergencyHospitals('')
    .map((hospital) => toMarkerShell(hospital, coordinate))
    .sort((a, b) => a.distanceM - b.distanceM);
}

export function searchMockHospitalMarkerShells(
  query: string,
  coordinate: GeoCoordinate,
): HospitalMarkerShell[] {
  return filterMockEmergencyHospitals(query)
    .map((hospital) => toMarkerShell(hospital, coordinate))
    .sort((a, b) => a.distanceM - b.distanceM);
}

export function getMockHospitalDetail(
  hpid: string,
  coordinate: GeoCoordinate,
): HospitalDetail | null {
  const hospital = findMockEmergencyHospital(hpid);
  if (!hospital) return null;

  const shell = toMarkerShell(hospital, coordinate);

  return {
    rnum: 0,
    phpid: '',
    hpid: hospital.hpid,
    hospitalName: hospital.hospitalName,
    erPhone: hospital.phone,
    updatedAt: new Date().toISOString(),
    availableErBeds: hospital.availableBeds,
    availablePediatricErBeds: hospital.availablePediatricErBeds,
    availableSurgeryBeds: 0,
    availableNeuroIcuBeds: 0,
    availableNeonatalIcuBeds: hospital.availablePediatricErBeds,
    availableChestIcuBeds: 0,
    availableGeneralIcuBeds: 0,
    availableInpatientBeds: 0,
    onCallDoctor: hospital.onCallDoctor ?? '응급의학과',
    ctAvailable: true,
    mriAvailable: hospital.specialties.includes('뇌졸중'),
    angioAvailable: hospital.specialties.includes('심장'),
    ventilatorAvailable: true,
    ambulanceAvailable: true,
    erDoctorPhone: hospital.phone,
    pediatricDoctorPhone: hospital.phone,
    icuInternalMedicineBeds: 0,
    icuSurgeryBeds: 0,
    icuOrthopedicBeds: 0,
    icuNeurologyBeds: 0,
    icuNeurosurgeryBeds: 0,
    icuToxicologyBeds: 0,
    icuBurnBeds: 0,
    icuTraumaBeds: 0,
    pediatricVentilatorAvailable: hospital.isPediatricPriority,
    incubatorAvailable: hospital.isPediatricPriority,
    status: hospital.status,
    address: hospital.address,
    phone: hospital.phone,
    latitude: hospital.latitude,
    longitude: hospital.longitude,
    emergencyClass: '01',
    emergencyClassName: hospital.department,
    distanceM: shell.distanceM,
    distanceKm: shell.distanceKm,
    walkMin: shell.walkMin,
    isMoonlightHospital: hospital.specialties.includes('달빛어린이'),
    isPediatricPriority: hospital.isPediatricPriority,
    description: `${hospital.specialties.join(' · ')} · 예상 대기 ${hospital.waitMin}분`,
    specialties: hospital.specialties,
    weeklySchedule: [],
    isOpenNow: false,
    openStatusLabel: '확인 필요',
  };
}

export function mergeHospitalMarkerShells(
  apiMarkers: HospitalMarkerShell[],
  mockMarkers: HospitalMarkerShell[],
): HospitalMarkerShell[] {
  const merged = new Map<string, HospitalMarkerShell>();

  for (const marker of mockMarkers) {
    merged.set(marker.hpid, marker);
  }
  for (const marker of apiMarkers) {
    merged.set(marker.hpid, marker);
  }

  return [...merged.values()].sort((a, b) => a.distanceM - b.distanceM);
}

export function filterHospitalMarkersByQuery(
  markers: HospitalMarkerShell[],
  query: string,
): HospitalMarkerShell[] {
  const q = query.trim().toLowerCase();
  if (!q) return markers;
  return markers.filter((item) => item.name.toLowerCase().includes(q));
}
