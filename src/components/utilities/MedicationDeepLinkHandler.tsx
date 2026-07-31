import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { navigateToUtilityTool } from '@/navigation/utilityNavigation';
import { navigationRef } from '@/navigation/navigationRef';
import { isMedicationTimerDeepLink } from '@/utils/medicationDeepLink';

type MedicationDeepLinkHandlerProps = {
  onOpenInstant?: () => void;
};

function openMedicationTimerFromDeepLink(onOpenInstant?: () => void, attempt = 0) {
  if (!navigationRef.isReady()) {
    if (attempt < 30) {
      setTimeout(() => openMedicationTimerFromDeepLink(onOpenInstant, attempt + 1), 100);
    }
    return;
  }

  navigateToUtilityTool('MedicationLogTimer');
  if (onOpenInstant) {
    requestAnimationFrame(() => onOpenInstant());
  }
}

/** 홈 화면 바로가기 딥링크 → 약물 타이머 화면 즉시 오픈 */
export function MedicationDeepLinkHandler({ onOpenInstant }: MedicationDeepLinkHandlerProps) {
  useEffect(() => {
    const openFromUrl = (url: string) => {
      if (!isMedicationTimerDeepLink(url)) return;
      openMedicationTimerFromDeepLink(onOpenInstant);
    };

    const subscription = Linking.addEventListener('url', ({ url }) => openFromUrl(url));
    void Linking.getInitialURL().then((url) => {
      if (url) openFromUrl(url);
    });

    return () => subscription.remove();
  }, [onOpenInstant]);

  return null;
}
