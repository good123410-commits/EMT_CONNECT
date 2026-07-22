/** CSV 변환본 — 민간 구급차 업체 레코드 */
export type PrivateAmbulanceRecord = {
  i: string;
  /** 기관명 */
  n: string;
  /** 보유 차종 요약 */
  t: string;
  /** 보유 차량 대수(동일 기관·지역) */
  vc: number;
  /** 지역 라벨 */
  r: string;
  a: string;
  /** 대표전화 */
  p: string;
  lat: number | null;
  lng: number | null;
  sd: string;
  sg: string;
};

export type PrivateAmbulanceListItem = PrivateAmbulanceRecord & {
  distanceM: number | null;
};

export type PrivateAmbulanceRegionQuery = {
  sido: string;
  sigungu: string;
};

export type PrivateAmbulanceSearchQuery = {
  departure: PrivateAmbulanceRegionQuery;
  destination: PrivateAmbulanceRegionQuery;
};
