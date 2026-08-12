export type UserMedicalProfile = {
  userId: string;
  chronicConditions: string;
  medications: string;
  allergies: string;
  emergencyContact1Name: string;
  emergencyContact1Phone: string;
  emergencyContact2Name: string;
  emergencyContact2Phone: string;
  medicalNotes: string;
  preferredHospital: string;
  updatedAt?: string | null;
};

export type UserMedicalProfileInput = Omit<UserMedicalProfile, 'userId' | 'updatedAt'>;

export function createEmptyUserMedicalProfile(userId: string): UserMedicalProfile {
  return {
    userId,
    chronicConditions: '',
    medications: '',
    allergies: '',
    emergencyContact1Name: '',
    emergencyContact1Phone: '',
    emergencyContact2Name: '',
    emergencyContact2Phone: '',
    medicalNotes: '',
    preferredHospital: '',
    updatedAt: null,
  };
}

export function hasUserMedicalProfileContent(profile: UserMedicalProfile): boolean {
  return Boolean(
    profile.chronicConditions.trim() ||
      profile.medications.trim() ||
      profile.allergies.trim() ||
      profile.emergencyContact1Name.trim() ||
      profile.emergencyContact1Phone.trim() ||
      profile.emergencyContact2Name.trim() ||
      profile.emergencyContact2Phone.trim() ||
      profile.medicalNotes.trim() ||
      profile.preferredHospital.trim(),
  );
}
