import { supabase } from '../lib/supabase';
import type { MonthlyInterview } from '../types';

export function isValidInterview(row: unknown): row is MonthlyInterview {
  if (!row || typeof row !== 'object') return false;
  const r = row as MonthlyInterview;
  return Boolean(r.id && r.title && r.published_month);
}

function normalizeInterviews(rows: unknown): MonthlyInterview[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isValidInterview);
}

export async function fetchPublishedInterviewById(id: string): Promise<MonthlyInterview | null> {
  try {
    const { data, error } = await supabase
      .from('kemix_monthly_interviews')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle();
    if (error || !isValidInterview(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchPublishedInterviews(limit = 12): Promise<MonthlyInterview[]> {
  try {
    const { data, error } = await supabase.rpc('list_published_interviews', { p_limit: limit });
    if (error) return [];
    return normalizeInterviews(data);
  } catch {
    return [];
  }
}

export async function fetchFeaturedInterview(): Promise<MonthlyInterview | null> {
  try {
    const { data, error } = await supabase.rpc('get_featured_interview');
    if (error || !isValidInterview(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function formatInterviewMonth(month: string | null | undefined): string {
  if (!month || typeof month !== 'string') return '';
  const [year, m] = month.split('-');
  if (!year || !m) return month;
  const monthNum = parseInt(m, 10);
  if (Number.isNaN(monthNum)) return month;
  return `${year}년 ${monthNum}월`;
}

export function formatInterviewTag(month: string | null | undefined): string {
  if (!month || typeof month !== 'string') return 'MONTHLY INTERVIEW';
  const [year, m] = month.split('-');
  if (!year || !m) return 'MONTHLY INTERVIEW';
  return `${year}.${m.padStart(2, '0')} MONTHLY INTERVIEW`;
}

export function formatInterviewHeroTag(month: string | null | undefined): string {
  if (!month || typeof month !== 'string') return '🎤 이달의 인터뷰';
  const [year, m] = month.split('-');
  if (!year || !m) return '🎤 이달의 인터뷰';
  return `🎤 ${year}.${m.padStart(2, '0')} 이달의 인터뷰`;
}

export function subscribeInterviews(onChange: () => void): () => void {
  try {
    const channel = supabase
      .channel('kemix_interviews_web')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kemix_monthly_interviews' },
        () => onChange(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => undefined;
  }
}
