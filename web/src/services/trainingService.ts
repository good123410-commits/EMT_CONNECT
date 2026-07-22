import { supabase } from '../lib/supabase';
import type { KemixTraining, TrainingStatus } from '../types';
import { normalizeDateString } from '../utils/dateUtils';

export type TrainingCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
};

const FALLBACK_CATEGORIES: TrainingCategory[] = [
  { id: 'fb-emergency', name: '응급의료', slug: 'emergency', display_order: 1, is_active: true },
  { id: 'fb-bls', name: 'BLS/ACLS', slug: 'bls-acls', display_order: 2, is_active: true },
  { id: 'fb-conf', name: '학술대회', slug: 'conference', display_order: 3, is_active: true },
  { id: 'fb-general', name: '기타', slug: 'general', display_order: 4, is_active: true },
];

export const TRAINING_STATUS_LABEL: Record<TrainingStatus, string> = {
  recruiting: '모집중',
  closed: '마감',
  upcoming: '예정',
};

function normalizeTraining(row: KemixTraining): KemixTraining {
  return {
    ...row,
    training_start: row.training_start ? normalizeDateString(row.training_start) : null,
    training_end: row.training_end ? normalizeDateString(row.training_end) : null,
  };
}

export async function fetchTrainingCategories(): Promise<TrainingCategory[]> {
  try {
    const { data, error } = await supabase.rpc('list_active_training_categories');
    if (error || !data?.length) return FALLBACK_CATEGORIES;
    return (data as TrainingCategory[]).filter((c) => c.is_active);
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function fetchTrainings(options: {
  category?: string | null;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<KemixTraining[]> {
  const category = options.category && options.category !== 'all' ? options.category : null;

  const { data, error } = await supabase.rpc('list_published_trainings', {
    p_category: category,
    p_search: options.search?.trim() || null,
    p_limit: options.limit ?? 50,
    p_offset: options.offset ?? 0,
  });

  if (!error && data) {
    return (data as KemixTraining[]).map(normalizeTraining);
  }

  let query = supabase.from('kemix_trainings').select('*').eq('is_published', true);
  if (category) query = query.eq('category', category);
  const search = options.search?.trim();
  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { data: fallback, error: fallbackError } = await query
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);

  if (fallbackError) throw error ?? fallbackError;
  return ((fallback ?? []) as KemixTraining[]).map(normalizeTraining);
}

export async function fetchTrainingById(id: string): Promise<KemixTraining | null> {
  const { data, error } = await supabase.rpc('get_published_training', { p_id: id });
  if (!error && data) return normalizeTraining(data as KemixTraining);

  const { data: fallback, error: fallbackError } = await supabase
    .from('kemix_trainings')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();

  if (fallbackError) throw error ?? fallbackError;
  return fallback ? normalizeTraining(fallback as KemixTraining) : null;
}

export function getTrainingCategoryLabel(slug: string, categories?: TrainingCategory[]): string {
  const fromList = categories?.find((c) => c.slug === slug)?.name;
  if (fromList) return fromList;
  return FALLBACK_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function formatTrainingPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return '일정 미정';
  const fmt = (v: string) => {
    const normalized = normalizeDateString(v);
    const [y, m, d] = normalized.split('-');
    return y && m && d ? `${y}.${m}.${d}` : v;
  };
  if (start && end && start !== end) return `${fmt(start)} ~ ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return '일정 미정';
}
