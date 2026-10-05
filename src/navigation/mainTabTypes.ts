import type { MedicalMapTab } from '@/types/medicalMap';

export type MainTabParamList = {
  Home: undefined;
  Guide: undefined;
  Map: { initialTab?: MedicalMapTab } | undefined;
  Paramedic: undefined;
  All: undefined;
};

/** @deprecated MainTabParamList 사용 */
export type PublicTabParamList = MainTabParamList;
