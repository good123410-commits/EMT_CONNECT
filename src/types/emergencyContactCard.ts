export type EmergencyContactCardData = {
  fullName: string;
  contact1Name: string;
  contact1Phone: string;
  contact2Name: string;
  contact2Phone: string;
  allergiesMedications: string;
  medicalNotes: string;
  preferredHospital: string;
  /** QR 공유용 비공개 토큰 (URL에만 사용) */
  shareToken?: string;
};

export const DEFAULT_EMERGENCY_CONTACT_CARD = (): EmergencyContactCardData => ({
  fullName: '',
  contact1Name: '',
  contact1Phone: '',
  contact2Name: '',
  contact2Phone: '',
  allergiesMedications: '',
  medicalNotes: '',
  preferredHospital: '',
});
