import type { LocationRegion } from '@/services/locationService';
import type { EmergencyTickerItem, EmergencyTickerSource } from '@/types/emergencyTicker';
import {
  extractDisasterSmsDateKey,
  toKstDateKey,
} from '@/utils/emergencyTickerDisasterSms';
import { logTickerPipeline } from '@/utils/emergencyTickerDebug';
import { messageMatchesUserSido } from '@/utils/emergencyTickerLocationFilter';

const DISASTER_SOURCES: EmergencyTickerSource[] = ['weather', 'forest_fire', 'disaster_sms'];

const INTERIM_LABEL = '현재 위치 확인 중';

function isDisasterSource(sourceType: EmergencyTickerSource): boolean {
  return DISASTER_SOURCES.includes(sourceType);
}

function hasUsableRegion(region: LocationRegion): boolean {
  const stage1 = region.stage1.trim();
  if (!stage1 || stage1.includes(INTERIM_LABEL)) return false;
  return true;
}

function mergeSmsItems(
  primary: EmergencyTickerItem[],
  secondary: EmergencyTickerItem[],
): EmergencyTickerItem[] {
  const seen = new Set<string>();
  const merged: EmergencyTickerItem[] = [];

  for (const item of [...primary, ...secondary]) {
    const key = `${item.sourceType}:${item.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

function pickTodayItemsForSource(
  items: EmergencyTickerItem[],
  source: EmergencyTickerSource,
  referenceDate: Date,
): EmergencyTickerItem[] {
  if (items.length === 0) return [];

  // 기상특보·산불은 동기화 시점의 최신 목록을 그대로 사용합니다.
  if (source === 'weather' || source === 'forest_fire') {
    return items;
  }

  const todayKey = toKstDateKey(referenceDate);

  if (source === 'disaster_sms') {
    const todayDated = items.filter(
      (item) => extractDisasterSmsDateKey(item.message, referenceDate) === todayKey,
    );
    const undated = items.filter(
      (item) => extractDisasterSmsDateKey(item.message, referenceDate) == null,
    );
    if (todayDated.length > 0) return mergeSmsItems(todayDated, undated);
    if (undated.length > 0) return undated;
    return [];
  }

  const datedToday = items.filter((item) => {
    const dateKey = extractDisasterSmsDateKey(item.message, referenceDate);
    return dateKey === todayKey;
  });
  if (datedToday.length > 0) return datedToday;

  const undated = items.filter(
    (item) => extractDisasterSmsDateKey(item.message, referenceDate) == null,
  );
  if (undated.length > 0) return undated;

  return [];
}

function resolveRegionalDisasterItems(
  items: EmergencyTickerItem[],
  region: LocationRegion,
  referenceDate: Date,
): EmergencyTickerItem[] {
  const regional = items.filter(
    (item) => isDisasterSource(item.sourceType) && messageMatchesUserSido(item.message, region),
  );

  const resolved: EmergencyTickerItem[] = [];
  for (const source of DISASTER_SOURCES) {
    const sourceRegional = regional.filter((item) => item.sourceType === source);
    resolved.push(...pickTodayItemsForSource(sourceRegional, source, referenceDate));
  }

  return resolved;
}

/**
 * 재난문자는 사용자 시·도(특별시/광역시) + 당일(KST) 기준으로 필터합니다.
 * 기상특보·산불은 지역 일치 시 최신 동기화 목록을 그대로 표시합니다.
 * 관리자가 지정한 sort_order 순서는 유지합니다.
 */
export function processEmergencyTickerForDisplay(
  items: EmergencyTickerItem[],
  region: LocationRegion,
  referenceDate = new Date(),
): EmergencyTickerItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  if (!hasUsableRegion(region)) {
    const adminOnly = items.filter((item) => item.sourceType === 'admin');
    logTickerPipeline('region-unavailable', items, adminOnly, {
      regionStage1: region.stage1,
    });
    return adminOnly;
  }

  const regionalCandidates = items.filter(
    (item) => isDisasterSource(item.sourceType) && messageMatchesUserSido(item.message, region),
  );
  const allowedDisasterKeys = new Set(
    resolveRegionalDisasterItems(items, region, referenceDate).map(
      (item) => `${item.sourceType}:${item.message}`,
    ),
  );

  const result = items.filter((item) => {
    if (item.sourceType === 'admin') return true;
    if (!isDisasterSource(item.sourceType)) return true;
    return allowedDisasterKeys.has(`${item.sourceType}:${item.message}`);
  });

  logTickerPipeline('regional+date', items, result, {
    region: { stage1: region.stage1, stage2: region.stage2 },
    regionalCandidates: regionalCandidates.length,
    todayKey: toKstDateKey(referenceDate),
  });

  return result;
}
