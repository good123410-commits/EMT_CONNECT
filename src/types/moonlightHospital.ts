export type MoonlightOperatingHours = {
  월요일?: string;
  화요일?: string;
  수요일?: string;
  목요일?: string;
  금요일?: string;
  토요일?: string;
  일요일?: string;
  공휴일?: string;
};

export type MoonlightHospitalRecord = {
  name: string;
  address: string;
  phone: string;
  operating_hours: MoonlightOperatingHours;
  map_coords?: string[];
};

export type MoonlightHospital = {
  id: string;
  name: string;
  displayName: string;
  address: string;
  phone: string;
  operatingHours: MoonlightOperatingHours;
};

export const MOONLIGHT_DAY_ORDER = [
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
  '일요일',
  '공휴일',
] as const;

export type MoonlightDayLabel = (typeof MOONLIGHT_DAY_ORDER)[number];
