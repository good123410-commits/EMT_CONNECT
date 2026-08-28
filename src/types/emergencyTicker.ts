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
