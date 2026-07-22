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

function isMissingColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('schema cache') ||
    lower.includes('could not find the') ||
    lower.includes('does not exist') ||
    lower.includes('column')
  );
}

function mapProfileSetupError(message: string): string {
  if (message.includes('nickname_taken')) {
    return '이미 사용 중인 별명입니다. 다른 별명을 입력해 주세요.';
  }
  if (message.includes('nickname_length_invalid')) {
    return '별명은 2~20자로 입력해 주세요.';
  }
  if (isMissingColumnError(message)) {
    return '프로필 DB 스키마가 최신이 아닙니다. Supabase SQL Editor에서 migration_v43_user_profiles_onboarding_fix.sql을 실행해 주세요.';
  }
  return message || '프로필 저장에 실패했습니다.';
}

/** PostgREST 스키마에 없는 컬럼은 제거하고 upsert 재시도 */
async function upsertUserProfileRow(payload: Record<string, unknown>): Promise<UserProfile> {
  let current: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await supabase
      .from(USER_PROFILES_TABLE)
      .upsert(current, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error && data) {
      return mapProfileRow(data as Record<string, unknown>);
    }

    if (!error) break;

    if (!isMissingColumnError(error.message)) {
      throw new Error(mapProfileSetupError(error.message));
    }

    const match = error.message.match(/Could not find the '([^']+)' column|"([^"]+)" of relation/);
    const missingKey = match?.[1] ?? match?.[2];
    if (!missingKey || !(missingKey in current)) {
      throw new Error(mapProfileSetupError(error.message));
    }

    const next = { ...current };
    delete next[missingKey];
    current = next;

    if (!('id' in current)) {
      throw new Error('프로필 id가 필요합니다.');
    }
  }

  throw new Error(
    '프로필 저장에 실패했습니다. Supabase에서 migration_v43_user_profiles_onboarding_fix.sql을 실행해 주세요.',
  );
}

async function completeProfileSetupDirect(input: ProfileSetupInput): Promise<UserProfile> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('로그인이 필요합니다.');

  await supabase.rpc('ensure_my_user_profile');

  return upsertUserProfileRow({
    id: userId,
    nickname: input.nickname.trim(),
    name: input.name?.trim() || null,
    phone: input.phone?.trim() || null,
    role: input.role,
    company_name: input.company_name?.trim() || null,
    profile_completed: true,
  });
}

export async function completeProfileSetup(input: ProfileSetupInput): Promise<UserProfile> {
  const { data, error } = await supabase.rpc('complete_my_profile', {
    p_nickname: input.nickname.trim(),
    p_name: input.name?.trim() || null,
    p_phone: input.phone?.trim() || null,
    p_role: input.role,
    p_company_name: input.company_name?.trim() || null,
  });

  if (!error && data) {
    return mapProfileRow(data as Record<string, unknown>);
  }

  if (error && isMissingColumnError(error.message)) {
    return completeProfileSetupDirect(input);
  }

  throw new Error(mapProfileSetupError(error?.message ?? ''));
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
