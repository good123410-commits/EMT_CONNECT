/** 엑셀 변환본 — 초경량 로컬 병원 레코드 */
export type LocalHospitalRecord = {
  i: string;
  n: string;
  a: string;
  p: string;
  lng: number;
  lat: number;
  sg: string;
  td: string;
  er: 0 | 1;
};

/** 엑셀 변환본 — 초경량 로컬 약국 레코드 */
export type LocalPharmacyRecord = {
  i: string;
  n: string;
  a: string;
  p: string;
  lng: number;
  lat: number;
  /** 공공데이터 원본 좌표(X)=경도 */
  x?: number;
  /** 공공데이터 원본 좌표(Y)=위도 */
  y?: number;
  sg: string;
  /** 심야약국 요일별 운영시간 [월,화,수,목,금,토,일,공휴일] e.g. "09:00~23:30" */
  wh?: string[];
};

export type LocalSearchOptions = {
  limit?: number;
  radiusMeters?: number;
  erOnly?: boolean;
  /** 수동 지역 선택 시 시도/시군구 필터 */
  regionFilter?: { stage1: string; stage2?: string };
};

export type LocalHospitalMarker = LocalHospitalRecord & {
  distanceM: number;
  walkMin: number;
  distanceKm: number;
  isPartner?: boolean;
  customMemo?: string;
  specialties?: string[];
  weeklySchedule?: import('@/utils/hospitalHours').HospitalDutyDay[];
  isOpenNow?: boolean;
  openStatusLabel?: string;
  hospitalType?: import('@/types/customHospital').CustomHospitalType;
  isCustomOnly?: boolean;
};

export type LocalPharmacyMarker = LocalPharmacyRecord & {
  distanceM: number;
  walkMin: number;
  distanceKm: number;
};

export const LIVE_STATUS_FALLBACK_MESSAGE =
  '실시간 정보 로드 실패 (119 문의 요망)';
