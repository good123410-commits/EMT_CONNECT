import { SIDO_LIST } from '@/services/locationService';
import type { EmergencyTickerDashboardItem } from '@/types/emergencyTicker';
import { isNationwideTickerMessage } from '@/utils/emergencyTickerLocationFilter';

export const TICKER_REGION_COMMON = '공통';
export const TICKER_REGION_NATIONWIDE = '전국';
/** @deprecated 시·도 미매칭 항목은 전국으로 분류합니다. */
export const TICKER_REGION_UNCLASSIFIED = '미분류';

function stripAdministrativeSuffix(value: string): string {
  return value
    .trim()
    .replace(/(특별자치도|특별자치시|특별시|광역시|자치시|도|시|군|구)$/u, '');
}

function sidoShortLabel(stage1: string): string {
  const stripped = stripAdministrativeSuffix(stage1);
  if (stripped.length >= 2) return stripped.slice(0, 2);
  return stripped;
}

function buildSidoNeedles(stage1: string): string[] {
  const needles = new Set<string>();
  if (stage1) {
    needles.add(stage1);
    needles.add(stripAdministrativeSuffix(stage1));
    needles.add(sidoShortLabel(stage1));
  }
  return [...needles].filter((value) => value.length >= 2);
}

function messageMentionsSido(message: string, sido: string): boolean {
  const needles = buildSidoNeedles(sido);
  return needles.some((needle) => message.includes(needle));
}

/** 전광판 문구 본문에서 언급된 시·도 목록을 추출합니다. 시·도가 없으면 전국으로 분류합니다. */
export function resolveTickerMessageSidos(message: string): string[] {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text) return [];

  if (isNationwideTickerMessage(text)) {
    return [TICKER_REGION_NATIONWIDE];
  }

  const matched: string[] = [];
  for (const sido of SIDO_LIST) {
    if (messageMentionsSido(text, sido)) {
      matched.push(sido);
    }
  }

  return matched.length > 0 ? matched : [TICKER_REGION_NATIONWIDE];
}

export function classifyTickerDashboardItem(item: EmergencyTickerDashboardItem): string[] {
  if (item.sourceType === 'admin') {
    return [TICKER_REGION_COMMON];
  }

  const text = (item.displayMessage || item.originalMessage).trim();
  return resolveTickerMessageSidos(text);
}

/** 홈 화면 지역 필터와 동일하게, 해당 시·도 사용자에게 노출되는 항목인지 판별합니다. */
export function itemMatchesRegionFilter(
  item: EmergencyTickerDashboardItem,
  selectedRegion: string,
): boolean {
  if (!selectedRegion) return true;

  if (selectedRegion === TICKER_REGION_COMMON) {
    return item.sourceType === 'admin';
  }

  const regions = classifyTickerDashboardItem(item);

  if (selectedRegion === TICKER_REGION_NATIONWIDE) {
    return regions.includes(TICKER_REGION_NATIONWIDE);
  }

  if (selectedRegion === TICKER_REGION_UNCLASSIFIED) {
    return false;
  }

  if (SIDO_LIST.includes(selectedRegion)) {
    if (item.sourceType === 'admin') return true;
    if (regions.includes(TICKER_REGION_NATIONWIDE)) return true;
    return regions.includes(selectedRegion);
  }

  return false;
}

export function countItemsForRegionFilter(
  items: EmergencyTickerDashboardItem[],
  selectedRegion: string,
): number {
  return items.filter((item) => itemMatchesRegionFilter(item, selectedRegion)).length;
}

export type TickerRegionGroup = {
  regionKey: string;
  label: string;
  items: EmergencyTickerDashboardItem[];
};

export function sidoAdminChipLabel(regionKey: string): string {
  if (regionKey === TICKER_REGION_COMMON) return '공통(안내)';
  if (regionKey === TICKER_REGION_NATIONWIDE) return '전국';
  if (regionKey === TICKER_REGION_UNCLASSIFIED) return '미분류';
  return regionKey.replace(/(특별자치도|특별자치시|특별시|광역시)$/u, '').replace(/도$/u, '');
}

const GROUP_ORDER: string[] = [
  TICKER_REGION_COMMON,
  TICKER_REGION_NATIONWIDE,
  ...SIDO_LIST,
];

export function groupDashboardItemsByRegion(
  items: EmergencyTickerDashboardItem[],
): TickerRegionGroup[] {
  const bucket = new Map<string, EmergencyTickerDashboardItem[]>();

  for (const item of items) {
    const regions = classifyTickerDashboardItem(item);
    for (const regionKey of regions) {
      const list = bucket.get(regionKey) ?? [];
      list.push(item);
      bucket.set(regionKey, list);
    }
  }

  const groups: TickerRegionGroup[] = [];
  for (const regionKey of GROUP_ORDER) {
    const regionItems = bucket.get(regionKey);
    if (!regionItems || regionItems.length === 0) continue;

    const seen = new Set<string>();
    const deduped = regionItems.filter((item) => {
      if (seen.has(item.itemKey)) return false;
      seen.add(item.itemKey);
      return true;
    });

    deduped.sort((left, right) => left.sortOrder - right.sortOrder);

    groups.push({
      regionKey,
      label: sidoAdminChipLabel(regionKey),
      items: deduped,
    });
  }

  return groups;
}

export function mergeRegionalReorder(
  allItems: EmergencyTickerDashboardItem[],
  isVisible: (item: EmergencyTickerDashboardItem) => boolean,
  reorderedVisible: EmergencyTickerDashboardItem[],
): EmergencyTickerDashboardItem[] {
  let visibleIndex = 0;
  return allItems.map((item) => {
    if (!isVisible(item)) return item;
    const next = reorderedVisible[visibleIndex];
    visibleIndex += 1;
    return next ?? item;
  });
}

export const TICKER_ADMIN_REGION_FILTERS: string[] = [
  TICKER_REGION_COMMON,
  TICKER_REGION_NATIONWIDE,
  ...SIDO_LIST,
];
