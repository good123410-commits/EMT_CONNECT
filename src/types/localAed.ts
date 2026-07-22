/** fetch_all_aeds.mjs 수집본 — 초경량 로컬 AED 레코드 */
export type LocalAedRecord = {
  name: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  model: string;
};

export type LocalAedSearchOptions = {
  limit?: number;
  radiusMeters?: number;
  regionFilter?: { stage1: string; stage2?: string };
};

export type LocalAedMarker = LocalAedRecord & {
  id: string;
  distanceM: number;
  walkMin: number;
};
