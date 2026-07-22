import { supabase } from '../lib/supabase';
import type { KemixSchedule } from '../types';
import { normalizeDateString } from '../utils/dateUtils';

function normalizeSchedule(row: KemixSchedule): KemixSchedule {
  return {
    ...row,
    start_date: normalizeDateString(row.start_date),
    end_date: normalizeDateString(row.end_date),
  };
}

export async function fetchSchedulesInRange(start: Date, end: Date): Promise<KemixSchedule[]> {
  const pStart = formatDateParam(start);
  const pEnd = formatDateParam(end);

  const { data, error } = await supabase.rpc('list_published_schedules_in_range', {
    p_start: pStart,
    p_end: pEnd,
  });

  if (!error && data) {
    return (data as KemixSchedule[]).map(normalizeSchedule);
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from('kemix_schedules')
    .select('*')
    .eq('is_published', true)
    .lte('start_date', pEnd)
    .gte('end_date', pStart)
    .order('start_date', { ascending: true });

  if (fallbackError) throw error ?? fallbackError;
  return ((fallback ?? []) as KemixSchedule[]).map(normalizeSchedule);
}

export async function fetchScheduleById(id: string): Promise<KemixSchedule | null> {
  const { data, error } = await supabase.rpc('get_published_schedule', { p_id: id });
  if (!error && data) return normalizeSchedule(data as KemixSchedule);

  const { data: fallback, error: fallbackError } = await supabase
    .from('kemix_schedules')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();

  if (fallbackError) throw error ?? fallbackError;
  return fallback ? normalizeSchedule(fallback as KemixSchedule) : null;
}

export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const normalized = normalizeDateString(key);
  const [y, m, d] = normalized.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateKey(date: Date): string {
  return formatDateParam(date);
}

export function formatScheduleRange(start: string, end: string): string {
  const s = formatDisplayDate(start);
  const e = formatDisplayDate(end);
  if (s === e) return s;
  return `${s} ~ ${e}`;
}

export function formatDisplayDate(iso: string): string {
  const normalized = normalizeDateString(iso);
  const [y, m, d] = normalized.split('-');
  if (!y || !m || !d) return iso;
  return `${y}.${m}.${d}`;
}

export function scheduleOccursOn(schedule: KemixSchedule, date: Date): boolean {
  const key = toDateKey(date);
  const start = normalizeDateString(schedule.start_date);
  const end = normalizeDateString(schedule.end_date);
  return key >= start && key <= end;
}

export function groupSchedulesByDate(schedules: KemixSchedule[]): Map<string, KemixSchedule[]> {
  const map = new Map<string, KemixSchedule[]>();
  for (const schedule of schedules) {
    const start = parseDateKey(schedule.start_date);
    const end = parseDateKey(schedule.end_date);
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = toDateKey(cursor);
      const list = map.get(key) ?? [];
      if (!list.some((item) => item.id === schedule.id)) {
        list.push(schedule);
      }
      map.set(key, list);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return map;
}
