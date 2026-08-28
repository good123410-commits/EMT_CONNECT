import { supabase } from '@/lib/supabaseClient';
import type { ContentShortcode, ShortcodePickerMode, UpsertContentShortcodeInput } from '@/types/shortcode';

export const BUILTIN_CONTENT_SHORTCODES: ContentShortcode[] = [
  {
    id: 'builtin-call-119',
    shortcut: '[call:119]',
    title: '119 긴급 전화',
    action_type: 'call_button',
    action_payload: { phone: '119', label: '응급 신고 119' },
    target_role: 'admin',
    sort_order: 10,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'builtin-119-button',
    shortcut: '[119_button]',
    title: '119 전화 버튼',
    action_type: 'call_button',
    action_payload: { phone: '119', label: '응급 신고' },
    target_role: 'admin',
    sort_order: 20,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'builtin-ad-banner',
    shortcut: '[ad_banner]',
    title: '이벤트 배너',
    action_type: 'ad_banner',
    action_payload: {},
    target_role: 'all',
    sort_order: 30,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'builtin-template-report',
    shortcut: '[template:report]',
    title: '상황 보고 양식',
    action_type: 'template',
    action_payload: {
      body: '[상황 보고]\n• 발생 시각:\n• 발생 장소:\n• 환자 상태:\n• 조치 내용:',
    },
    target_role: 'all',
    sort_order: 40,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

export function mergeContentShortcodes(dbRows: ContentShortcode[]): ContentShortcode[] {
  const byShortcut = new Map<string, ContentShortcode>();
  for (const builtin of BUILTIN_CONTENT_SHORTCODES) {
    byShortcut.set(builtin.shortcut, builtin);
  }
  for (const row of dbRows) {
    byShortcut.set(row.shortcut, row);
  }
  return [...byShortcut.values()].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
}

export async function fetchActiveContentShortcodes(): Promise<ContentShortcode[]> {
  const { data, error } = await supabase.rpc('list_active_content_shortcodes');
  if (error) {
    return BUILTIN_CONTENT_SHORTCODES;
  }
  const rows = (data ?? []) as ContentShortcode[];
  return mergeContentShortcodes(rows);
}

export async function adminListContentShortcodes(): Promise<ContentShortcode[]> {
  const { data, error } = await supabase.rpc('admin_list_content_shortcodes');
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as ContentShortcode[];
}

export async function adminUpsertContentShortcode(
  input: UpsertContentShortcodeInput,
): Promise<ContentShortcode> {
  const { data, error } = await supabase.rpc('admin_upsert_content_shortcode', {
    p_id: input.id ?? null,
    p_shortcut: input.shortcut,
    p_title: input.title,
    p_action_type: input.action_type,
    p_action_payload: input.action_payload,
    p_target_role: input.target_role,
    p_sort_order: input.sort_order,
    p_is_active: input.is_active,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as ContentShortcode;
}

export async function adminDeleteContentShortcode(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_content_shortcode', { p_id: id });
  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeContentShortcodes(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemix_content_shortcodes_mobile')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kemix_content_shortcodes' }, () =>
      onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function filterShortcodesForPicker(
  shortcodes: ContentShortcode[],
  mode: ShortcodePickerMode,
): ContentShortcode[] {
  return shortcodes.filter((row) => {
    if (!row.is_active) return false;
    if (mode === 'admin') return true;
    return row.target_role === 'all';
  });
}
