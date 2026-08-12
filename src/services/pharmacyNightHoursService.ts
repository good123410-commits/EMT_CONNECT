import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';
import type { LocalPharmacyMarker, LocalPharmacyRecord } from '@/types/localFacility';

const CACHE_KEY = 'ems_night_pharmacy_hours_v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

export type NightPharmacyRow = {
  phone_normalized: string;
  name: string;
  road_address: string | null;
  lot_address: string | null;
  weekly_hours: string[];
  synced_at: string;
};

type CachedNightPharmacyPayload = {
  savedAt: number;
  byPhone: Record<string, string[]>;
};

let memoryCache: Map<string, string[]> | null = null;
let memoryLoadedAt = 0;

function normalizePhone(value: string | undefined | null): string {
  return String(value ?? '').replace(/\D/g, '');
}

function isFresh(savedAt: number): boolean {
  return Date.now() - savedAt < CACHE_TTL_MS;
}

async function loadFromAsyncStorage(): Promise<Map<string, string[]> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedNightPharmacyPayload;
    if (!parsed?.byPhone || !isFresh(parsed.savedAt)) return null;
    return new Map(Object.entries(parsed.byPhone));
  } catch {
    return null;
  }
}

async function saveToAsyncStorage(map: Map<string, string[]>): Promise<void> {
  const payload: CachedNightPharmacyPayload = {
    savedAt: Date.now(),
    byPhone: Object.fromEntries(map.entries()),
  };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

async function fetchNightPharmaciesFromSupabase(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('night_pharmacies')
      .select('phone_normalized, weekly_hours')
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as Pick<NightPharmacyRow, 'phone_normalized' | 'weekly_hours'>[];
    if (rows.length === 0) break;

    for (const row of rows) {
      const phone = normalizePhone(row.phone_normalized);
      const hours = Array.isArray(row.weekly_hours)
        ? row.weekly_hours.map((value) => String(value ?? '').trim())
        : [];
      if (phone && hours.some(Boolean)) {
        map.set(phone, hours);
      }
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return map;
}

/** Supabase 심야약국 운영시간 맵 로드 (메모리·AsyncStorage·Supabase 순) */
export async function ensurePharmacyNightHoursLoaded(): Promise<Map<string, string[]>> {
  if (memoryCache && isFresh(memoryLoadedAt)) {
    return memoryCache;
  }

  const cached = await loadFromAsyncStorage();
  if (cached?.size) {
    memoryCache = cached;
    memoryLoadedAt = Date.now();
    void fetchNightPharmaciesFromSupabase()
      .then(async (fresh) => {
        if (fresh.size > 0) {
          memoryCache = fresh;
          memoryLoadedAt = Date.now();
          await saveToAsyncStorage(fresh);
        }
      })
      .catch(() => {
        // 백그라운드 갱신 실패 시 캐시 유지
      });
    return cached;
  }

  try {
    const fresh = await fetchNightPharmaciesFromSupabase();
    memoryCache = fresh;
    memoryLoadedAt = Date.now();
    if (fresh.size > 0) {
      await saveToAsyncStorage(fresh);
    }
    return fresh;
  } catch {
    return memoryCache ?? new Map();
  }
}

export function mergeNightHoursIntoPharmacy<
  T extends Pick<LocalPharmacyRecord, 'p' | 'wh'>,
>(record: T, hoursByPhone: Map<string, string[]> | undefined): T {
  if (!hoursByPhone?.size) return record;

  const phone = normalizePhone(record.p);
  const remoteHours = phone ? hoursByPhone.get(phone) : undefined;
  if (!remoteHours?.some(Boolean)) return record;

  return {
    ...record,
    wh: remoteHours,
  };
}

export function mergeNightHoursIntoPharmacyMarkers(
  markers: LocalPharmacyMarker[],
  hoursByPhone: Map<string, string[]> | undefined,
): LocalPharmacyMarker[] {
  if (!hoursByPhone?.size) return markers;
  return markers.map((marker) => mergeNightHoursIntoPharmacy(marker, hoursByPhone));
}
