import type { ContentShortcodeSegment } from './contentShortcodes';
import {
  hasContentShortcodes,
  parseContentShortcodes,
  stripContentShortcodes,
} from './contentShortcodes';

/** @deprecated 레거시 세그먼트 타입 */
export type CommunityContentSegment =
  | { type: 'text'; value: string }
  | { type: '119_call'; phone: string; label?: string }
  | { type: 'ad_banner'; bannerId?: string };

function mapToLegacySegment(segment: ContentShortcodeSegment): CommunityContentSegment {
  if (segment.type === 'call_button') {
    return { type: '119_call', phone: segment.phone, label: segment.label };
  }
  return segment;
}

/** @deprecated `parseContentShortcodes` 사용 */
export function parseCommunityShortcodes(raw: string): CommunityContentSegment[] {
  return parseContentShortcodes(raw).map(mapToLegacySegment);
}

/** @deprecated `stripContentShortcodes` 사용 */
export function stripCommunityShortcodes(raw: string): string {
  return stripContentShortcodes(raw);
}

/** @deprecated `hasContentShortcodes` 사용 */
export function hasCommunityShortcodes(raw: string): boolean {
  return hasContentShortcodes(raw);
}
