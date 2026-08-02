import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { EmergencyQuickViewOverlay } from '@/components/utilities/EmergencyQuickViewOverlay';
import { loadEmergencyContactCard } from '@/services/emergencyContactStorage';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';
import {
  hasEmergencyCardContent,
  isEmergencyQuickViewUrl,
} from '@/utils/emergencyCardEncoding';

const EMPTY_CARD: EmergencyContactCardData = {
  fullName: '',
  contact1Name: '',
  contact1Phone: '',
  contact2Name: '',
  contact2Phone: '',
  allergiesMedications: '',
  medicalNotes: '',
  preferredHospital: '',
};

/**
 * 잠금화면 숏컷 딥링크(`emergency-quick-view`)를 앱 어디서든 즉시 Quick View로 연결합니다.
 */
export function EmergencyQuickViewBootstrap() {
  const [visible, setVisible] = useState(false);
  const [card, setCard] = useState<EmergencyContactCardData>(EMPTY_CARD);

  const openQuickView = useCallback(async () => {
    const saved = await loadEmergencyContactCard();
    setCard(saved);
    setVisible(true);
  }, []);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      if (isEmergencyQuickViewUrl(event.url)) {
        void openQuickView();
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url && isEmergencyQuickViewUrl(url)) {
        void openQuickView();
      }
    });

    return () => subscription.remove();
  }, [openQuickView]);

  if (!visible) return null;

  return (
    <EmergencyQuickViewOverlay
      visible={visible}
      data={card}
      mode="quick"
      onClose={() => setVisible(false)}
    />
  );
}

export function canShowEmergencyQuickView(card: EmergencyContactCardData): boolean {
  return hasEmergencyCardContent(card);
}
