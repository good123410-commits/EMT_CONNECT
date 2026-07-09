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

export type ProfileRole = 'public' | 'emt_certified';

export type Profile = {
  id: string;
  name: string | null;
  role: ProfileRole;
  is_approved: boolean;
  invitation_code_used: string | null;
  wallet_balance: number;
  created_at: string;
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
