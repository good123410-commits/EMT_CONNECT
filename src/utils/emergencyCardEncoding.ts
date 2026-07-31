import * as Linking from 'expo-linking';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';

export const EMERGENCY_QUICK_VIEW_PATH = 'emergency-quick-view';

export function getEmergencyQuickViewUrl(): string {
  return Linking.createURL(EMERGENCY_QUICK_VIEW_PATH);
}

export function isEmergencyQuickViewUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return (
    normalized.includes(EMERGENCY_QUICK_VIEW_PATH) ||
    normalized.includes('emergency-quick-view')
  );
}

export function buildEmergencyCardPayload(data: EmergencyContactCardData): string {
  const lines: string[] = ['KEMIX 응급 의료 정보'];
  if (data.fullName.trim()) lines.push(`이름: ${data.fullName.trim()}`);
  if (data.contact1Name.trim() || data.contact1Phone.trim()) {
    lines.push(`비상1: ${data.contact1Name.trim()} ${data.contact1Phone.trim()}`.trim());
  }
  if (data.contact2Name.trim() || data.contact2Phone.trim()) {
    lines.push(`비상2: ${data.contact2Name.trim()} ${data.contact2Phone.trim()}`.trim());
  }
  if (data.allergiesMedications.trim()) {
    lines.push(`알레르기/약물: ${data.allergiesMedications.trim()}`);
  }
  if (data.preferredHospital.trim()) {
    lines.push(`선호 병원: ${data.preferredHospital.trim()}`);
  }
  if (data.medicalNotes.trim()) {
    lines.push(`메모: ${data.medicalNotes.trim()}`);
  }
  return lines.join('\n');
}

export function hasEmergencyCardContent(data: EmergencyContactCardData): boolean {
  return Boolean(
    data.fullName.trim() ||
      data.contact1Name.trim() ||
      data.contact1Phone.trim() ||
      data.contact2Name.trim() ||
      data.contact2Phone.trim() ||
      data.allergiesMedications.trim() ||
      data.medicalNotes.trim() ||
      data.preferredHospital.trim(),
  );
}
