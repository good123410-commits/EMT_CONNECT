import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constants/env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type UserRole = 'user' | 'hospital' | 'paramedic' | 'private_ems' | 'admin';

export type HiddenPostTargetRole =
  | 'all'
  | 'hospital'
  | 'paramedic'
  | 'private_ems'
  | 'nurse';

export type UserProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  name: string | null;
  company_name: string | null;
  invitation_code: string | null;
  is_approved: boolean;
  wallet_balance: number;
  created_at: string;
};

/** @deprecated UserProfile 사용 */
export type Profile = UserProfile;
/** @deprecated UserRole 사용 */
export type ProfileRole = UserRole;

export type HiddenPost = {
  id: string;
  author_id: string;
  target_role: HiddenPostTargetRole;
  title: string;
  content: string;
  created_at: string;
  author?: Pick<UserProfile, 'name' | 'company_name' | 'role'> | null;
};

export type PrivateEmsCallStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PrivateEmsCall = {
  id: string;
  requester_id: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  status: PrivateEmsCallStatus;
  assigned_operator_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EmtVerification = {
  id: string;
  user_id: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes: string | null;
  updated_at: string;
};

export const VERIFICATIONS_BUCKET = 'verifications';

export const USER_PROFILES_TABLE = 'user_profiles';
export const HIDDEN_POSTS_TABLE = 'hidden_posts';
export const PRIVATE_EMS_CALLS_TABLE = 'private_ems_calls';
export const EMERGENCY_GUIDES_TABLE = 'emergency_guides';
export const GUIDE_CATEGORIES_TABLE = 'guide_categories';
