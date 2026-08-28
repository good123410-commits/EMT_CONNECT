import { navigateToChemicalScreen, navigateToMainTab } from '@/navigation/mainTabNavigation';
import { navigateToUtilityTool } from '@/navigation/utilityNavigation';
import type { BookmarkTarget } from '@/types/bookmark';

export function navigateToBookmarkTarget(target: BookmarkTarget): void {
  switch (target.type) {
    case 'mainTab':
      navigateToMainTab(target.screen, target.params);
      return;
    case 'utility':
      navigateToUtilityTool(target.screen);
      return;
    case 'chemical':
      navigateToChemicalScreen();
      return;
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}
