import type { AppIconName } from '@/components/ui/AppIcon';
import { CHEMICAL_SCREEN_TITLE } from '@/constants/navigationHeader';
import type { UtilityToolItem } from '@/constants/utilityTools';
import type { BookmarkInput } from '@/types/bookmark';

export function createUtilityToolBookmark(tool: UtilityToolItem): BookmarkInput {
  return {
    id: `utility-${tool.id}`,
    title: tool.title,
    subtitle: '응급 유틸',
    icon: tool.icon as AppIconName,
    iconColor: tool.accent,
    iconBg: tool.accentBg,
    target: { type: 'utility', screen: tool.route },
  };
}

export const CHEMICAL_BOOKMARK: BookmarkInput = {
  id: 'chemical',
  title: CHEMICAL_SCREEN_TITLE,
  subtitle: '의약품 검색',
  icon: 'flask-outline',
  iconColor: '#A78BFA',
  iconBg: '#2A2240',
  target: { type: 'chemical' },
};
