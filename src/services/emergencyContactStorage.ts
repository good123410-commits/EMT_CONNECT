// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

import { DEFAULT_EMERGENCY_CONTACT_CARD, type EmergencyContactCardData } from '@/types/emergencyContactCard';
export async function loadEmergencyContactCard(): Promise<EmergencyContactCardData> {
  return DEFAULT_EMERGENCY_CONTACT_CARD();
}
export async function saveEmergencyContactCard(_data: EmergencyContactCardData): Promise<void> {}

/*
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncEmergencyOverlayFromCard } from '@/services/emergencyOverlayService';
import { syncEmergencyMedicalShare } from '@/services/emergencyShareService';
import {
  DEFAULT_EMERGENCY_CONTACT_CARD,
  type EmergencyContactCardData,
} from '@/types/emergencyContactCard';
import { ensureShareToken } from '@/utils/emergencyCardEncoding';

const STORAGE_KEY = 'kemix_emergency_contact_card_v1';

export async function loadEmergencyContactCard(): Promise<EmergencyContactCardData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EMERGENCY_CONTACT_CARD();
    const parsed = JSON.parse(raw) as Partial<EmergencyContactCardData>;
    const merged = { ...DEFAULT_EMERGENCY_CONTACT_CARD(), ...parsed };
    const withToken = ensureShareToken(merged);
    if (withToken.shareToken !== merged.shareToken) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withToken));
    }
    return withToken;
  } catch {
    return DEFAULT_EMERGENCY_CONTACT_CARD();
  }
}

export async function saveEmergencyContactCard(data: EmergencyContactCardData): Promise<void> {
  const withToken = ensureShareToken(data);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withToken));
  await syncEmergencyOverlayFromCard(withToken);
  try {
    await syncEmergencyMedicalShare(withToken);
  } catch {
    // 오프라인·마이그레이션 미적용 시에도 로컬 저장은 유지
  }
}

*/
