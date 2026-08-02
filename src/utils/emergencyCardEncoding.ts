// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

import type { EmergencyContactCardData } from '@/types/emergencyContactCard';
export const EMERGENCY_QUICK_VIEW_PATH = 'emergency-quick-view';
export function getEmergencyQuickViewUrl(): string { return ''; }
export function isEmergencyQuickViewUrl(_url: string): boolean { return false; }
export function ensureShareToken(data: EmergencyContactCardData): EmergencyContactCardData { return data; }
export function buildEmergencyShareUrl(_shareToken: string): string { return ''; }
export function getEmergencyShareUrl(_data: EmergencyContactCardData): string { return ''; }
export function buildEmergencyCardPayload(_data: EmergencyContactCardData): string { return ''; }
export function hasEmergencyCardContent(_data: EmergencyContactCardData): boolean { return false; }
export function buildEmergencyOverlaySyncPayload(_data: EmergencyContactCardData): string { return '{}'; }

/*
import * as Linking from 'expo-linking';
import { KEMIX_WEB_URL } from '@/constants/env';
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

function createShareToken(): string {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function ensureShareToken(data: EmergencyContactCardData): EmergencyContactCardData {
  const existing = data.shareToken?.trim();
  if (existing && existing.length >= 16) {
    return { ...data, shareToken: existing };
  }
  return { ...data, shareToken: createShareToken() };
}

export function buildEmergencyShareUrl(shareToken: string): string {
  const base = KEMIX_WEB_URL.trim().replace(/\/$/, '');
  return `${base}/emergency/${encodeURIComponent(shareToken)}`;
}

export function getEmergencyShareUrl(data: EmergencyContactCardData): string {
  const withToken = ensureShareToken(data);
  return buildEmergencyShareUrl(withToken.shareToken!);
}

/** 앱 내 상세 미리보기·인쇄용 텍스트 (공개 화면에서는 사용하지 않음) *\/
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
  lines.push('', `웹 프로필: ${getEmergencyShareUrl(data)}`);
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

export function buildEmergencyOverlaySyncPayload(data: EmergencyContactCardData): string {
  const withToken = ensureShareToken(data);
  return JSON.stringify({
    publicShareUrl: buildEmergencyShareUrl(withToken.shareToken!),
    hasContent: hasEmergencyCardContent(data),
  });
}

*/
