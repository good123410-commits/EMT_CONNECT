import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchUserMedicalProfile,
  saveUserMedicalProfile,
} from '@/services/userMedicalProfileService';
import {
  createEmptyUserMedicalProfile,
  hasUserMedicalProfileContent,
  type UserMedicalProfile,
  type UserMedicalProfileInput,
} from '@/types/userMedicalProfile';

const STORAGE_KEY = 'ems_user_medical_profile_v1';
export const LOCAL_GUEST_MEDICAL_USER_ID = 'local-guest';

type StoredMedicalProfilePayload = UserMedicalProfileInput & {
  userId?: string;
  updatedAt?: string | null;
};

function inputFromProfile(profile: UserMedicalProfile): UserMedicalProfileInput {
  return {
    chronicConditions: profile.chronicConditions,
    medications: profile.medications,
    allergies: profile.allergies,
    emergencyContact1Name: profile.emergencyContact1Name,
    emergencyContact1Phone: profile.emergencyContact1Phone,
    emergencyContact2Name: profile.emergencyContact2Name,
    emergencyContact2Phone: profile.emergencyContact2Phone,
    medicalNotes: profile.medicalNotes,
    preferredHospital: profile.preferredHospital,
  };
}

async function loadFromAsyncStorage(): Promise<UserMedicalProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMedicalProfilePayload;
    const userId = parsed.userId ?? LOCAL_GUEST_MEDICAL_USER_ID;
    return {
      userId,
      chronicConditions: parsed.chronicConditions ?? '',
      medications: parsed.medications ?? '',
      allergies: parsed.allergies ?? '',
      emergencyContact1Name: parsed.emergencyContact1Name ?? '',
      emergencyContact1Phone: parsed.emergencyContact1Phone ?? '',
      emergencyContact2Name: parsed.emergencyContact2Name ?? '',
      emergencyContact2Phone: parsed.emergencyContact2Phone ?? '',
      medicalNotes: parsed.medicalNotes ?? '',
      preferredHospital: parsed.preferredHospital ?? '',
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return null;
  }
}

async function saveToAsyncStorage(profile: UserMedicalProfile): Promise<void> {
  const payload: StoredMedicalProfilePayload = {
    ...inputFromProfile(profile),
    userId: profile.userId,
    updatedAt: profile.updatedAt ?? new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** 로그인 시 DB 우선, 실패·미로그인 시 AsyncStorage 폴백 */
export async function loadStoredMedicalProfile(
  userId?: string | null,
): Promise<UserMedicalProfile> {
  const local = await loadFromAsyncStorage();
  const effectiveUserId = userId ?? LOCAL_GUEST_MEDICAL_USER_ID;

  if (!userId) {
    return local ?? createEmptyUserMedicalProfile(LOCAL_GUEST_MEDICAL_USER_ID);
  }

  try {
    const remote = await fetchUserMedicalProfile(userId);
    if (hasUserMedicalProfileContent(remote)) {
      await saveToAsyncStorage(remote);
      return remote;
    }
    if (local && hasUserMedicalProfileContent(local)) {
      return { ...local, userId };
    }
    return remote;
  } catch {
    return local ?? createEmptyUserMedicalProfile(effectiveUserId);
  }
}

/** AsyncStorage 저장 + 로그인 시 DB 동기화 */
export async function persistMedicalProfile(
  userId: string | null | undefined,
  input: UserMedicalProfileInput,
): Promise<UserMedicalProfile> {
  const effectiveUserId = userId ?? LOCAL_GUEST_MEDICAL_USER_ID;
  const localProfile: UserMedicalProfile = {
    ...input,
    userId: effectiveUserId,
    updatedAt: new Date().toISOString(),
  };

  await saveToAsyncStorage(localProfile);

  if (!userId) {
    return localProfile;
  }

  try {
    const saved = await saveUserMedicalProfile(userId, input);
    await saveToAsyncStorage(saved);
    return saved;
  } catch {
    return localProfile;
  }
}
