export type MockLocation = {
  lat: number;
  lng: number;
  label: string;
};

export type AedLocation = {
  id: string;
  name: string;
  address: string;
  distanceM: number;
  walkMin: number;
  available: boolean;
  lastChecked: string;
  lat: number;
  lng: number;
};

export type ErStatus = 'available' | 'congested' | 'full';

export type EmergencyRoom = {
  id: string;
  hospitalName: string;
  department: string;
  distanceKm: number;
  totalBeds: number;
  availableBeds: number;
  status: ErStatus;
  waitMin: number;
  specialties: string[];
  phone: string;
};

export const MOCK_USER_LOCATION: MockLocation = {
  lat: 37.5665,
  lng: 126.978,
  label: '서울시 중구 (가상 GPS)',
};

export const AED_LOCATIONS: AedLocation[] = [
  {
    id: 'aed1',
    name: '서울역 1층 로비',
    address: '서울특별시 용산구 한강대로 405',
    distanceM: 120,
    walkMin: 2,
    available: true,
    lastChecked: '2026-07-09 14:00',
    lat: 37.5547,
    lng: 126.9707,
  },
  {
    id: 'aed2',
    name: '남대문시장 관리사무소',
    address: '서울특별시 중구 남대문시장길 21',
    distanceM: 350,
    walkMin: 5,
    available: true,
    lastChecked: '2026-07-09 13:30',
    lat: 37.559,
    lng: 126.977,
  },
  {
    id: 'aed3',
    name: '명동성당 본당',
    address: '서울특별시 중구 명동길 74',
    distanceM: 480,
    walkMin: 7,
    available: true,
    lastChecked: '2026-07-09 12:00',
    lat: 37.5636,
    lng: 126.9876,
  },
  {
    id: 'aed4',
    name: '시청역 2번 출구',
    address: '서울특별시 중구 세종대로 110',
    distanceM: 620,
    walkMin: 9,
    available: false,
    lastChecked: '2026-07-09 10:00',
    lat: 37.564,
    lng: 126.9769,
  },
  {
    id: 'aed5',
    name: '을지로입구역 대합실',
    address: '서울특별시 중구 을지로 50',
    distanceM: 890,
    walkMin: 12,
    available: true,
    lastChecked: '2026-07-09 14:15',
    lat: 37.566,
    lng: 126.982,
  },
  {
    id: 'aed6',
    name: '롯데백화점 본점 1층',
    address: '서울특별시 중구 남대문로 81',
    distanceM: 1100,
    walkMin: 15,
    available: true,
    lastChecked: '2026-07-09 11:00',
    lat: 37.5648,
    lng: 126.981,
  },
];

export const EMERGENCY_ROOMS: EmergencyRoom[] = [
  {
    id: 'er1',
    hospitalName: '서울적십자병원',
    department: '응급의학과',
    distanceKm: 1.2,
    totalBeds: 28,
    availableBeds: 6,
    status: 'available',
    waitMin: 25,
    specialties: ['외상', '심장', '뇌졸중'],
    phone: '02-2002-8000',
  },
  {
    id: 'er2',
    hospitalName: '국립중앙의료원',
    department: '응급의학과',
    distanceKm: 1.8,
    totalBeds: 35,
    availableBeds: 2,
    status: 'congested',
    waitMin: 55,
    specialties: ['외상', '화상', '중독'],
    phone: '02-2260-7114',
  },
  {
    id: 'er3',
    hospitalName: '세브란스병원',
    department: '응급의학과',
    distanceKm: 3.5,
    totalBeds: 42,
    availableBeds: 8,
    status: 'available',
    waitMin: 30,
    specialties: ['외상', '심장', '소아'],
    phone: '02-2228-5800',
  },
  {
    id: 'er4',
    hospitalName: '서울대학교병원',
    department: '응급의학과',
    distanceKm: 4.1,
    totalBeds: 38,
    availableBeds: 0,
    status: 'full',
    waitMin: 90,
    specialties: ['외상', '뇌졸중', '심장'],
    phone: '02-2072-2475',
  },
  {
    id: 'er5',
    hospitalName: '경희대학교병원',
    department: '응급의학과',
    distanceKm: 5.2,
    totalBeds: 30,
    availableBeds: 4,
    status: 'available',
    waitMin: 35,
    specialties: ['외상', '중독'],
    phone: '02-958-8114',
  },
];

export function searchAedLocations(query: string): AedLocation[] {
  const q = query.trim().toLowerCase();
  const sorted = [...AED_LOCATIONS].sort((a, b) => a.distanceM - b.distanceM);
  if (!q) return sorted;
  return sorted.filter(
    (a) =>
      a.name.toLowerCase().includes(q) || a.address.toLowerCase().includes(q),
  );
}

export function searchEmergencyRooms(query: string): EmergencyRoom[] {
  const q = query.trim().toLowerCase();
  const sorted = [...EMERGENCY_ROOMS].sort((a, b) => a.distanceKm - b.distanceKm);
  if (!q) return sorted;
  return sorted.filter(
    (e) =>
      e.hospitalName.toLowerCase().includes(q) ||
      e.specialties.some((s) => s.toLowerCase().includes(q)),
  );
}

export const ER_STATUS_LABELS: Record<ErStatus, string> = {
  available: '여유',
  congested: '혼잡',
  full: '포화',
};

export const ER_STATUS_COLORS: Record<ErStatus, string> = {
  available: '#22c55e',
  congested: '#f97316',
  full: '#ef4444',
};
