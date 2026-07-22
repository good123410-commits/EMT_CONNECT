import type { UserRole } from '@/lib/supabaseClient';

export type AdminUserRow = {
  id: string;
  email: string | null;
  role: UserRole;
  name: string | null;
  company_name: string | null;
  invitation_code: string | null;
  is_approved: boolean;
  is_blocked: boolean;
  wallet_balance: number;
  created_at: string;
};

export type AdminUserActivity = {
  questions: Array<{ id: string; title: string; status: string; created_at: string }>;
  posts: Array<{ id: string; title: string; target_role: string; created_at: string }>;
  answers: Array<{ id: string; question_id: string; created_at: string }>;
};

export type AdminVerificationRow = {
  id: string;
  user_id: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes: string | null;
  updated_at: string;
};

export type AdminInvitationCode = {
  id: string;
  code: string;
  target_role: UserRole;
  created_by: string | null;
  expires_at: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
};

export type AdminJobPost = {
  id: string;
  post_type: 'hire' | 'seek';
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  schedule: string | null;
  requirements: string | null;
  content: string | null;
  is_urgent: boolean;
  is_published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminPrivateAmbulance = {
  id: string;
  external_id: string | null;
  name: string;
  vehicle_type: string | null;
  vehicle_count: number;
  region: string | null;
  address: string | null;
  phone: string;
  sido: string;
  sigungu: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type AdminCustomHospital = {
  id: string;
  external_id: string | null;
  hpid: string | null;
  name: string;
  hospital_type: 'er' | 'moonlight' | 'pediatric' | 'general';
  sido: string;
  sigungu: string;
  address: string | null;
  tel: string;
  operating_hours: unknown;
  departments: string[];
  custom_memo: string | null;
  is_hidden: boolean;
  is_partner: boolean;
  er_capable: boolean;
  latitude: number | null;
  longitude: number | null;
  hvctayn: string | null;
  hvmriayn: string | null;
  hvangioayn: string | null;
  hvventiayn: string | null;
  hvamyn: string | null;
  hv120: string | null;
  hv122: string | null;
  hv2: number | null;
  hv3: number | null;
  hv4: number | null;
  hv5: number | null;
  hv6: number | null;
  hv7: number | null;
  hv8: number | null;
  hv9: number | null;
  hv10: string | null;
  hv11: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminKemiPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  thumbnail_url: string | null;
  views: number;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminDashboardTab =
  | 'approval'
  | 'users'
  | 'auth'
  | 'content'
  | 'moderation'
  | 'chat'
  | 'questions'
  | 'ambulance'
  | 'hospitals'
  | 'blog';
