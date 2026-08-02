import { supabase } from '@/lib/supabaseClient';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';
import { ensureShareToken } from '@/utils/emergencyCardEncoding';

export async function syncEmergencyMedicalShare(data: EmergencyContactCardData): Promise<void> {
  const withToken = ensureShareToken(data);
  const token = withToken.shareToken;
  if (!token) return;

  const payload = {
    fullName: withToken.fullName,
    contact1Name: withToken.contact1Name,
    contact1Phone: withToken.contact1Phone,
    contact2Name: withToken.contact2Name,
    contact2Phone: withToken.contact2Phone,
    allergiesMedications: withToken.allergiesMedications,
    medicalNotes: withToken.medicalNotes,
    preferredHospital: withToken.preferredHospital,
  };

  const { error } = await supabase.rpc('upsert_emergency_medical_share', {
    p_token: token,
    p_payload: payload,
  });

  if (error) {
    throw error;
  }
}
