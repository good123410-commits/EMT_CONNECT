/** `assets/data/generated/shelters.json` 원본 레코드 */
export type ShelterJsonRecord = {
  cc_nm: string;
  rn_adres: string;
  x: number;
  y: number;
};

export type LocalShelterMarker = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  walkMin: number;
};

export type LocalShelterSearchOptions = {
  limit?: number;
  radiusMeters?: number;
  regionFilter?: {
    stage1: string;
    stage2?: string;
  };
};
