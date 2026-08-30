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

function buildLocationNeedles(region: LocationRegion): string[] {
  const needles = new Set<string>();
  const stage1 = region.stage1.trim();
  const stage2 = region.stage2.trim();

  if (stage1) {
    needles.add(stage1);
    needles.add(stripAdministrativeSuffix(stage1));
    needles.add(sidoShortLabel(stage1));
  }

  if (stage2) {
    needles.add(stage2);
    const stage2Base = stripAdministrativeSuffix(stage2);
    if (stage2Base) needles.add(stage2Base);
  }

  if (stage1 && stage2) {
    needles.add(`${stripAdministrativeSuffix(stage1)} ${stage2}`);
    needles.add(`${sidoShortLabel(stage1)} ${stripAdministrativeSuffix(stage2)}`);
    needles.add(`${stage1} ${stage2}`);
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

export function messageMatchesUserRegion(message: string, region: LocationRegion): boolean {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text) return false;
  if (NATIONWIDE_PATTERN.test(text)) return true;

  const stage1 = region.stage1.trim();
  const stage2 = region.stage2.trim();
  if (!stage1) return false;

  const needles = buildLocationNeedles(region);
  const matched = needles.some((needle) => text.includes(needle));
  if (!matched) return false;

  if (stage2) {
    const stage2Base = stripAdministrativeSuffix(stage2);
    const sigunguMatched =
      text.includes(stage2) || (stage2Base.length >= 2 && text.includes(stage2Base));

    if (sigunguMatched && stage2Base.length <= 2) {
      return text.includes(stage1) || text.includes(sidoShortLabel(stage1));
    }
  }

  if (mentionsOtherSido(text, stage1) && !text.includes(stage1) && !text.includes(sidoShortLabel(stage1))) {
    return false;
  }

  return true;
}

export function filterTickerItemsByLocation(
  items: EmergencyTickerItem[],
  region: LocationRegion,
): EmergencyTickerItem[] {
  const regionReady = hasUsableRegion(region);

  return items.filter((item) => {
    if (item.sourceType === 'admin') return true;
    if (!isDisasterSource(item.sourceType)) return true;
    // GPS 확정 전에는 Supabase 데이터를 그대로 표시 (Expo Go 초기 로딩 시 빈 티커 방지)
    if (!regionReady) return true;
    return messageMatchesUserRegion(item.message, region);
  });
}
