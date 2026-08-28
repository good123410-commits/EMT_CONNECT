export type ShortcodeActionType = 'call_button' | 'ad_banner' | 'template';

export type ShortcodeTargetRole = 'admin' | 'all';

export type ShortcodePickerMode = 'admin' | 'user';

export type ShortcodeCallPayload = {
  phone?: string;
  label?: string;
};

export type ShortcodeAdBannerPayload = {
  bannerId?: string;
};

export type ShortcodeTemplatePayload = {
  body?: string;
};

export type ShortcodeActionPayload =
  | ShortcodeCallPayload
  | ShortcodeAdBannerPayload
  | ShortcodeTemplatePayload;

export type ContentShortcode = {
  id: string;
  shortcut: string;
  title: string;
  action_type: ShortcodeActionType;
  action_payload: ShortcodeActionPayload;
  target_role: ShortcodeTargetRole;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UpsertContentShortcodeInput = {
  id?: string;
  shortcut: string;
  title: string;
  action_type: ShortcodeActionType;
  action_payload: ShortcodeActionPayload;
  target_role: ShortcodeTargetRole;
  sort_order: number;
  is_active: boolean;
};

export const ADMIN_SHORTCODE_TRIGGER = '[@ㅅ@]';
export const USER_SHORTCODE_TRIGGER = '@';
