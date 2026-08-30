export type EmergencyTickerSource =
  | 'admin'
  | 'weather'
  | 'forest_fire'
  | 'disaster_sms'
  | string;

export type EmergencyTickerItem = {
  message: string;
  sourceType: EmergencyTickerSource;
  priority: number;
  sortOrder: number;
};

export type HomeEmergencyNotice = {
  id: string;
  message: string;
  isActive: boolean;
  sortOrder: number;
  expiresAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UpsertHomeEmergencyNoticeInput = {
  id?: string;
  message: string;
  isActive?: boolean;
  sortOrder?: number;
  expiresAt?: string | null;
};

export type EmergencyTickerDashboardItem = {
  itemKey: string;
  sourceType: EmergencyTickerSource;
  originalMessage: string;
  displayMessage: string;
  isActive: boolean;
  sortOrder: number;
  adminNoticeId: string | null;
  cacheSourceCode: string | null;
  cacheFetchedAt: string | null;
  cacheExpiresAt: string | null;
  cacheIsExpired: boolean;
  settingsUpdatedAt: string | null;
};

export type UpsertEmergencyTickerItemSettingInput = {
  itemKey: string;
  sourceType: EmergencyTickerSource;
  originalMessage: string;
  displayMessage?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  adminNoticeId?: string | null;
  cacheSourceCode?: string | null;
};

export type ReorderEmergencyTickerItemInput = {
  itemKey: string;
  sourceType: EmergencyTickerSource;
  originalMessage: string;
  sortOrder: number;
  adminNoticeId?: string | null;
  cacheSourceCode?: string | null;
};

export const EMERGENCY_TICKER_SOURCE_LABELS: Record<string, string> = {
  admin: '안내',
  weather: '기상특보',
  forest_fire: '산불',
  disaster_sms: '재난문자',
};
