import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { loadStoredMedicalProfile } from '@/services/medicalProfileStorage';
import { acquireCurrentGpsPosition } from '@/utils/mapNavigation';
import type { GeoCoordinate } from '@/services/locationService';
import type { UserMedicalProfile } from '@/types/userMedicalProfile';
import { hasUserMedicalProfileContent } from '@/types/userMedicalProfile';

export type EmergencyLocationSnapshot = {
  coordinate: GeoCoordinate | null;
  address: string | null;
};

export type EmergencySmsContext = {
  phone: string;
  displayName?: string | null;
  medicalProfile?: UserMedicalProfile | null;
  location?: EmergencyLocationSnapshot | null;
};

function normalizeSmsPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '') || '119';
}

/** 119·112 등 긴급 신고 번호 여부 (정확히 일치) */
export function isEmergencyHotline(phone: string): boolean {
  const normalized = normalizeSmsPhone(phone);
  return normalized === '119' || normalized === '112';
}

function buildInterceptMessage(phone: string): string {
  return `현재 GPS 위치와 저장된 개인 의료정보 및 비상연락망을 ${phone}로 전송하시겠습니까?`;
}

function buildSmsUrl(phone: string, body: string): string {
  const dial = normalizeSmsPhone(phone);
  const separator = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${dial}${separator}body=${encodeURIComponent(body)}`;
}

async function openEmergencyDial(phone: string): Promise<void> {
  const dial = normalizeSmsPhone(phone);
  const url = `tel:${dial}`;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
    return;
  }

  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

async function resolveAddressFromCoordinate(coordinate: GeoCoordinate): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync(coordinate);
    const first = results[0];
    if (!first) return null;

    const parts = [
      first.region,
      first.city,
      first.district,
      first.street,
      first.streetNumber,
      first.name,
    ]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : null;
  } catch {
    return null;
  }
}

/** GPS 좌표와 주소를 비동기로 확보 (navigator.geolocation → expo-location 폴백) */
export async function acquireEmergencyLocation(): Promise<EmergencyLocationSnapshot> {
  const coordinate = await acquireCurrentGpsPosition();
  if (!coordinate) {
    return { coordinate: null, address: null };
  }

  const address = await resolveAddressFromCoordinate(coordinate);
  return { coordinate, address };
}

function appendLine(lines: string[], label: string, value?: string | null): void {
  const trimmed = value?.trim();
  if (trimmed) {
    lines.push(`${label}: ${trimmed}`);
  }
}

/** 개인 의료정보 + GPS + 비상연락망을 결합한 긴급 문자 본문 생성 */
export function buildEmergencySmsMessage(context: EmergencySmsContext): string {
  const lines: string[] = ['[EMS Connect 긴급 신고]'];

  appendLine(lines, '이름', context.displayName);

  const location = context.location;
  if (location?.address) {
    appendLine(lines, '현재 위치', location.address);
  }
  if (location?.coordinate) {
    const { latitude, longitude } = location.coordinate;
    lines.push(`좌표: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
  }

  const profile = context.medicalProfile;
  if (profile && hasUserMedicalProfileContent(profile)) {
    appendLine(lines, '기저질환', profile.chronicConditions);
    appendLine(lines, '복용 약물', profile.medications);
    appendLine(lines, '알레르기', profile.allergies);
    if (profile.emergencyContact1Name.trim() || profile.emergencyContact1Phone.trim()) {
      lines.push(
        `비상연락1: ${profile.emergencyContact1Name.trim()} ${profile.emergencyContact1Phone.trim()}`.trim(),
      );
    }
    if (profile.emergencyContact2Name.trim() || profile.emergencyContact2Phone.trim()) {
      lines.push(
        `비상연락2: ${profile.emergencyContact2Name.trim()} ${profile.emergencyContact2Phone.trim()}`.trim(),
      );
    }
    appendLine(lines, '선호 응급병원', profile.preferredHospital);
    appendLine(lines, '의료 메모', profile.medicalNotes);
  }

  lines.push('', '위급 상황입니다. 신속한 출동을 요청합니다.');
  return lines.join('\n');
}

export async function composeEmergencySmsContext(options: {
  phone: string;
  userId?: string | null;
  displayName?: string | null;
}): Promise<EmergencySmsContext> {
  const [location, medicalProfile] = await Promise.all([
    acquireEmergencyLocation(),
    loadStoredMedicalProfile(options.userId),
  ]);

  return {
    phone: options.phone,
    displayName: options.displayName,
    medicalProfile,
    location,
  };
}

/** SMS 앱을 열어 긴급 문자 작성 화면으로 이동 */
export async function openEmergencySms(context: EmergencySmsContext): Promise<void> {
  const body = buildEmergencySmsMessage(context);
  const url = buildSmsUrl(context.phone, body);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (!canOpen) {
    Alert.alert('문자 전송 불가', '이 기기에서 문자 앱을 열 수 없습니다.');
    return;
  }

  await Linking.openURL(url);
}

async function executeEmergencySmsSend(options: {
  phone: string;
  userId?: string | null;
  displayName?: string | null;
}): Promise<void> {
  const context = await composeEmergencySmsContext(options);
  await openEmergencySms(context);
}

/**
 * 앱 전역 긴급전화(119/112) 인터셉트 — 확인 Alert 후 GPS·의료정보·비상연락망 SMS 발송.
 */
export function interceptEmergencyCall(options: {
  phone?: string;
  userId?: string | null;
  displayName?: string | null;
}): Promise<boolean> {
  const phone = normalizeSmsPhone(options.phone ?? '119');
  const message = buildInterceptMessage(phone);

  if (Platform.OS !== 'web') {
    void openEmergencyDial(phone);
  }

  const runSend = async (): Promise<boolean> => {
    try {
      await executeEmergencySmsSend({
        phone,
        userId: options.userId,
        displayName: options.displayName,
      });
      return true;
    } catch {
      Alert.alert('문자 전송 실패', '긴급 문자를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return false;
    }
  };

  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const confirmed =
        typeof window !== 'undefined' &&
        window.confirm(`긴급 정보 문자 전송\n\n${message}`);
      if (!confirmed) {
        resolve(false);
        return;
      }
      void runSend().then(resolve);
    });
  }

  return new Promise((resolve) => {
    Alert.alert(
      '긴급 정보 문자 전송',
      message,
      [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        {
          text: '예',
          onPress: () => {
            void runSend().then(resolve);
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** @alias interceptEmergencyCall */
export const promptEmergencySmsSend = interceptEmergencyCall;

/** @alias interceptEmergencyCall */
export const triggerEmergencyResponse = interceptEmergencyCall;
