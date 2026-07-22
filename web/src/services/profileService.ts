import { isAdminRole } from '../constants/roles';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';

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
    company_name: typeof row.company_name === 'string' ? row.company_name : null,
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

export function isApprovedAdmin(profile: UserProfile | null): boolean {
  if (!profile?.is_approved || profile.is_blocked) return false;
  return isAdminRole(profile.role);
}
