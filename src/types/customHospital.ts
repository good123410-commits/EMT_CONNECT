import type { HospitalDutyDay } from '@/utils/hospitalHours';

export type CustomHospitalType = 'er' | 'moonlight' | 'pediatric' | 'general';

export const CUSTOM_HOSPITAL_TYPE_LABELS: Record<CustomHospitalType, string> = {
  er: '응급실',
  moonlight: '달빛어린이병원',
  pediatric: '소아',
  general: '일반병의원',
};

export type CustomHospitalRow = {
  id: string;
  external_id: string | null;
  hpid: string | null;
  name: string;
  hospital_type: CustomHospitalType;
  sido: string;
  sigungu: string;
  address: string | null;
  tel: string;
  operating_hours: HospitalDutyDay[] | unknown;
  departments: string[];
  custom_memo: string | null;
  is_hidden: boolean;
  is_partner: boolean;
  er_capable: boolean;
  latitude: number | null;
  longitude: number | null;
  hvctayn: string | null;
  hvmriayn: string | null;
  hvangioayn: string | null;
  hvventiayn: string | null;
  hvamyn: string | null;
  hv120: string | null;
  hv122: string | null;
  hv2: number | null;
  hv3: number | null;
  hv4: number | null;
  hv5: number | null;
  hv6: number | null;
  hv7: number | null;
  hv8: number | null;
  hv9: number | null;
  hv10: string | null;
  hv11: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomHospitalOverlay = {
  isPartner: boolean;
  customMemo?: string;
  specialties: string[];
  weeklySchedule: HospitalDutyDay[];
  isOpenNow: boolean;
  openStatusLabel: string;
  hospitalType: CustomHospitalType;
  isCustomOnly: boolean;
};
