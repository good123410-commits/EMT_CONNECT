import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
  getSupabaseEnvDiagnostics,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '@/constants/env';
import { supabaseMobileFetch } from '@/lib/supabaseFetch';

const resolvedSupabaseUrl = SUPABASE_URL || DEFAULT_SUPABASE_URL;
const resolvedSupabaseAnonKey = SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (__DEV__) {
  const diagnostics = getSupabaseEnvDiagnostics();
  console.log('[supabase] init', {
    url: diagnostics.url,
    source: diagnostics.source,
    anonKeyLength: diagnostics.anonKeyLength,
    rejectedLocalhost: diagnostics.rejectedLocalhost,
    platform: Platform.OS,
  });
  if (diagnostics.rejectedLocalhost) {
    console.warn(
      '[supabase] localhost/사설 IP URL은 Expo Go에서 동작하지 않습니다. EXPO_PUBLIC_SUPABASE_URL을 공인 HTTPS로 설정하세요.',
    );
  }
  if (!diagnostics.anonKeyConfigured) {
    console.warn('[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY가 비어 있습니다. 기본 키로 폴백합니다.');
  }
}

/** 웹에서는 localStorage, 네이티브에서는 AsyncStorage */
const authStorage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => {
          try {
            return Promise.resolve(
              typeof globalThis.localStorage !== 'undefined'
                ? globalThis.localStorage.getItem(key)
                : null,
            );
          } catch {
            return Promise.resolve(null);
          }
        },
        setItem: (key: string, value: string) => {
          try {
            if (typeof globalThis.localStorage !== 'undefined') {
              globalThis.localStorage.setItem(key, value);
            }
          } catch {
            // ignore quota errors
          }
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          try {
            if (typeof globalThis.localStorage !== 'undefined') {
              globalThis.localStorage.removeItem(key);
            }
          } catch {
            // ignore
          }
          return Promise.resolve();
        },
      }
    : AsyncStorage;

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  global: {
    fetch: supabaseMobileFetch,
  },
});

export type UserRole = 'user' | 'associate_member' | 'regular_member' | 'admin';

export type HiddenPostTargetRole =
  | 'all'
  | 'hospital'
  | 'paramedic'
  | 'private_ems'
  | 'nurse';

export type EmsAuthStatus = 'none' | 'pending' | 'code_required' | 'verified';

export type UserProfile = {
  id: string;
  email: string | null;
  role: UserRole;
  name: string | null;
  nickname?: string | null;
  phone?: string | null;
  company_name: string | null;
  invitation_code: string | null;
  auth_status?: EmsAuthStatus;
  is_approved: boolean;
  is_blocked?: boolean;
  membership_dues_paid?: boolean;
  membership_dues_paid_at?: string | null;
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
export const QUESTIONS_TABLE = 'questions';
export const ANSWERS_TABLE = 'answers';

export type QuestionStatus = 'pending' | 'answered';

export type UserQuestion = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: QuestionStatus;
  created_at: string;
};

export type ParamedicAnswer = {
  id: string;
  question_id: string;
  paramedic_id: string;
  content: string;
  created_at: string;
};

export type UserQuestionWithAnswer = UserQuestion & {
  answer?: ParamedicAnswer | null;
};
