import { supabase } from '@/lib/supabaseClient';
import {
  createEmptyUserMedicalProfile,
  type UserMedicalProfile,
  type UserMedicalProfileInput,
} from '@/types/userMedicalProfile';

const TABLE = 'user_medical_profiles';

type UserMedicalProfileRow = {
  user_id: string;
  chronic_conditions: string;
  medications: string;
  allergies: string;
  emergency_contact_1_name: string;
  emergency_contact_1_phone: string;
  emergency_contact_2_name: string;
  emergency_contact_2_phone: string;
  medical_notes: string;
  preferred_hospital: string;
  updated_at: string | null;
};

function mapRow(row: UserMedicalProfileRow): UserMedicalProfile {
  return {
    userId: row.user_id,
    chronicConditions: row.chronic_conditions ?? '',
    medications: row.medications ?? '',
    allergies: row.allergies ?? '',
    emergencyContact1Name: row.emergency_contact_1_name ?? '',
    emergencyContact1Phone: row.emergency_contact_1_phone ?? '',
    emergencyContact2Name: row.emergency_contact_2_name ?? '',
    emergencyContact2Phone: row.emergency_contact_2_phone ?? '',
    medicalNotes: row.medical_notes ?? '',
    preferredHospital: row.preferred_hospital ?? '',
    updatedAt: row.updated_at,
  };
}

function toRow(userId: string, input: UserMedicalProfileInput): Omit<UserMedicalProfileRow, 'updated_at'> {
  return {
    user_id: userId,
    chronic_conditions: input.chronicConditions.trim(),
    medications: input.medications.trim(),
    allergies: input.allergies.trim(),
    emergency_contact_1_name: input.emergencyContact1Name.trim(),
    emergency_contact_1_phone: input.emergencyContact1Phone.trim(),
    emergency_contact_2_name: input.emergencyContact2Name.trim(),
    emergency_contact_2_phone: input.emergencyContact2Phone.trim(),
    medical_notes: input.medicalNotes.trim(),
    preferred_hospital: input.preferredHospital.trim(),
  };
}

export async function fetchUserMedicalProfile(userId: string): Promise<UserMedicalProfile> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`개인 의료정보를 불러오지 못했습니다: ${error.message}`);
  }

  if (!data) {
    return createEmptyUserMedicalProfile(userId);
  }

  return mapRow(data as UserMedicalProfileRow);
}

export async function saveUserMedicalProfile(
  userId: string,
  input: UserMedicalProfileInput,
): Promise<UserMedicalProfile> {
  const payload = {
    ...toRow(userId, input),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    throw new Error(`개인 의료정보 저장에 실패했습니다: ${error.message}`);
  }

  return mapRow(data as UserMedicalProfileRow);
}
