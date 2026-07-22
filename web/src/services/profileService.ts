import { isAdminRole } from '../constants/roles';
import { supabase } from '../lib/supabase';
import type { ProfileSetupInput, UserProfile, UserRole } from '../types';

const USER_PROFILES_TABLE = 'user_profiles';
const LEGACY_PROFILES_TABLE = 'profiles';

const VALID_ROLES: UserRole[] = [
  'user',
  'associate_member',
  'regular_member',
  'sub_admin',
  'super_admin',
  'hospital',
  'paramedic',
  'private_ems',
  'admin',
];

function mapRole(role: unknown): UserRole {
  if (typeof role === 'string' && (VALID_ROLES as string[]).includes(role)) {
    return role as UserRole;
  }
  if (role === 'emt_certified') return 'paramedic';
  return 'user';
}

function mapProfileRow(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id ?? ''),
    email: typeof row.email === 'string' ? row.email : null,
    role: mapRole(row.role),
    name: typeof row.name === 'string' ? row.name : null,
    nickname: typeof row.nickname === 'string' ? row.nickname : null,
    phone: typeof row.phone === 'string' ? row.phone : null,
    company_name: typeof row.company_name === 'string' ? row.company_name : null,
    profile_completed: Boolean(row.profile_completed),
    is_approved: Boolean(row.is_approved),
    is_blocked: Boolean(row.is_blocked),
    created_at:
      typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

async function fetchFromTable(table: string, userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from(table).select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return mapProfileRow(data as Record<string, unknown>);
}

/** 앱과 동일 — user_profiles 우선, legacy profiles 폴백 */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  try {
    const profile = await fetchFromTable(USER_PROFILES_TABLE, userId);
    if (profile) return profile;
  } catch {
    // ignore — legacy fallback
  }

  try {
    return await fetchFromTable(LEGACY_PROFILES_TABLE, userId);
  } catch {
    return null;
  }
}

export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.profile_completed) return true;
  return Boolean(profile.nickname?.trim());
}

export function getCommunityDisplayName(profile: UserProfile | null, email?: string | null): string {
  const nickname = profile?.nickname?.trim();
  if (nickname) return nickname;
  const name = profile?.name?.trim();
  if (name) return name;
  if (email) return email.split('@')[0] || '웹 회원';
  return '웹 회원';
}

export async function completeProfileSetup(input: ProfileSetupInput): Promise<UserProfile> {
  const { data, error } = await supabase.rpc('complete_my_profile', {
    p_nickname: input.nickname.trim(),
    p_name: input.name?.trim() || null,
    p_phone: input.phone?.trim() || null,
    p_role: input.role,
    p_company_name: input.company_name?.trim() || null,
  });

  if (error) {
    if (error.message.includes('nickname_taken')) {
      throw new Error('이미 사용 중인 별명입니다. 다른 별명을 입력해 주세요.');
    }
    if (error.message.includes('nickname_length_invalid')) {
      throw new Error('별명은 2~20자로 입력해 주세요.');
    }
    throw new Error(error.message || '프로필 저장에 실패했습니다.');
  }

  return mapProfileRow(data as Record<string, unknown>);
}

export async function findEmailHintByNickname(nickname: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('find_email_hint_by_nickname', {
    p_nickname: nickname.trim(),
  });

  if (error) {
    if (error.message.includes('ambiguous_nickname')) {
      throw new Error('동일한 별명이 여러 개 있어 조회할 수 없습니다. 고객센터로 문의해 주세요.');
    }
    throw new Error(error.message || '이메일 조회에 실패했습니다.');
  }

  return typeof data === 'string' ? data : null;
}

export function isApprovedAdmin(profile: UserProfile | null): boolean {
  if (!profile?.is_approved || profile.is_blocked) return false;
  return isAdminRole(profile.role);
}
