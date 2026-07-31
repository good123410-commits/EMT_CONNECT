import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncEmergencyOverlayFromCard } from '@/services/emergencyOverlayService';
import {
  DEFAULT_EMERGENCY_CONTACT_CARD,
  type EmergencyContactCardData,
} from '@/types/emergencyContactCard';

const STORAGE_KEY = 'kemix_emergency_contact_card_v1';

export async function loadEmergencyContactCard(): Promise<EmergencyContactCardData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EMERGENCY_CONTACT_CARD();
    const parsed = JSON.parse(raw) as Partial<EmergencyContactCardData>;
    return { ...DEFAULT_EMERGENCY_CONTACT_CARD(), ...parsed };
  } catch {
    return DEFAULT_EMERGENCY_CONTACT_CARD();
  }
}

export async function saveEmergencyContactCard(data: EmergencyContactCardData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  await syncEmergencyOverlayFromCard(data);
}
