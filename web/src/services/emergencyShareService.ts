import { supabase } from '../lib/supabase';

export type EmergencyMedicalSharePayload = {
  fullName?: string;
  contact1Name?: string;
  contact1Phone?: string;
  contact2Name?: string;
  contact2Phone?: string;
  allergiesMedications?: string;
  medicalNotes?: string;
  preferredHospital?: string;
};

export type EmergencyMedicalShareRecord = {
  share_token: string;
  payload: EmergencyMedicalSharePayload;
  updated_at: string;
};

export async function fetchEmergencyMedicalShare(
  token: string,
): Promise<EmergencyMedicalShareRecord | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase.rpc('get_emergency_medical_share', {
    p_token: trimmed,
  });

  if (error) throw error;
  if (!data || typeof data !== 'object') return null;

  const record = data as {
    share_token?: string;
    payload?: EmergencyMedicalSharePayload;
    updated_at?: string;
  };

  if (!record.payload) return null;

  return {
    share_token: record.share_token ?? trimmed,
    payload: record.payload,
    updated_at: record.updated_at ?? new Date().toISOString(),
  };
}
