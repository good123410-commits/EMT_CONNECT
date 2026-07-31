import type { UtilitiesStackParamList } from '@/navigation/UtilitiesStackNavigator';
import { navigationRef } from '@/navigation/navigationRef';

export function navigateToUtilityTool(screen: keyof UtilitiesStackParamList): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Utilities', { screen });
}

export function closeUtilitiesStack(): void {
  if (!navigationRef.isReady()) return;
  if (navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}
