import { SIDO_LIST, type LocationRegion } from '@/services/locationService';
import type { EmergencyTickerItem, EmergencyTickerSource } from '@/types/emergencyTicker';

const NATIONWIDE_PATTERN = /전국|대한민국|전\s*지역|전지역/;
const INTERIM_LABEL = '현재 위치 확인 중';

const DISASTER_SOURCES: EmergencyTickerSource[] = ['weather', 'forest_fire', 'disaster_sms'];

function isDisasterSource(sourceType: EmergencyTickerSource): boolean {
  return DISASTER_SOURCES.includes(sourceType);
}

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

function hasUsableRegion(region: LocationRegion): boolean {
  const stage1 = region.stage1.trim();
  if (!stage1 || stage1.includes(INTERIM_LABEL)) return false;
  return true;
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

function mentionsOtherSido(message: string, userStage1: string): boolean {
  const userShort = sidoShortLabel(userStage1);
  for (const sido of SIDO_LIST) {
    if (sido === userStage1) continue;
    if (message.includes(sido)) return true;
    const short = sidoShortLabel(sido);
    if (short.length >= 2 && short !== userShort && message.includes(short)) {
      return true;
    }
  }
  return false;
}

/** 시·도(특별시/광역시/도) 단위로 메시지가 사용자 지역과 일치하는지 판별합니다. */
export function messageMatchesUserSido(message: string, region: LocationRegion): boolean {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text) return false;

  const stage1 = region.stage1.trim();
  if (!stage1) return false;

  const needles = buildSidoNeedles(stage1);
  const matched = needles.some((needle) => text.includes(needle));
  if (!matched) return false;

  if (
    mentionsOtherSido(text, stage1) &&
    !text.includes(stage1) &&
    !text.includes(sidoShortLabel(stage1))
  ) {
    return false;
  }

  if (NATIONWIDE_PATTERN.test(text) && !matched) {
    return false;
  }

  return true;
}

/** @deprecated messageMatchesUserSido 사용 */
export function messageMatchesUserRegion(message: string, region: LocationRegion): boolean {
  return messageMatchesUserSido(message, region);
}

export function filterTickerItemsByLocation(
  items: EmergencyTickerItem[],
  region: LocationRegion,
): EmergencyTickerItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const regionReady = hasUsableRegion(region);

  return items.filter((item) => {
    if (item.sourceType === 'admin') return true;
    if (!isDisasterSource(item.sourceType)) return true;
    if (!regionReady) return false;
    return messageMatchesUserSido(item.message, region);
  });
}
