import {
  supabase,
  USER_PROFILES_TABLE,
  type UserProfile,
  type UserRole,
} from '@/lib/supabaseClient';

const LEGACY_PROFILES_TABLE = 'profiles';

function mapLegacyRole(role: string | null | undefined): UserRole {
  if (role === 'emt_certified') return 'paramedic';
  if (role === 'public') return 'user';
  if (role === 'hospital' || role === 'paramedic' || role === 'private_ems' || role === 'admin') return role;
  return 'user';
}

function mapLegacyProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id ?? ''),
    email: typeof row.email === 'string' ? row.email : null,
    role: mapLegacyRole(typeof row.role === 'string' ? row.role : null),
    name: typeof row.name === 'string' ? row.name : null,
    company_name: typeof row.company_name === 'string' ? row.company_name : null,
    invitation_code:
      typeof row.invitation_code === 'string'
        ? row.invitation_code
        : typeof row.invitation_code_used === 'string'
          ? row.invitation_code_used
          : null,
    is_approved: Boolean(row.is_approved),
    wallet_balance: Number(row.wallet_balance) || 0,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

async function fetchFromTable(table: string, userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from(table).select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return table === USER_PROFILES_TABLE
    ? (data as UserProfile)
    : mapLegacyProfile(data as Record<string, unknown>);
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    return await fetchFromTable(USER_PROFILES_TABLE, userId);
  } catch {
    try {
      return await fetchFromTable(LEGACY_PROFILES_TABLE, userId);
    } catch {
      return null;
    }
  }
}

export async function ensureProfile(
  userId: string,
  name?: string,
  email?: string,
): Promise<UserProfile> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const payload = {
    id: userId,
    email: email ?? null,
    name: name ?? null,
    role: 'user' as const,
    is_approved: false,
    wallet_balance: 0,
  };

  try {
    const { data, error } = await supabase
      .from(USER_PROFILES_TABLE)
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return data as UserProfile;
  } catch {
    const { data, error } = await supabase
      .from(LEGACY_PROFILES_TABLE)
      .insert({
        id: userId,
        name: name ?? null,
        role: 'public',
        is_approved: false,
        wallet_balance: 0,
      })
      .select('*')
      .single();

    if (error) throw error;
    return mapLegacyProfile(data as Record<string, unknown>);
  }
}

export async function updateProfileRole(
  userId: string,
  role: UserRole,
  invitationCode?: string,
  isApproved = false,
): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from(USER_PROFILES_TABLE)
      .update({
        role,
        is_approved: isApproved,
        invitation_code: invitationCode ?? null,
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data as UserProfile;
  } catch {
    const legacyRole = role === 'user' ? 'public' : role === 'paramedic' ? 'emt_certified' : role;
    const { data, error } = await supabase
      .from(LEGACY_PROFILES_TABLE)
      .update({
        role: legacyRole,
        is_approved: isApproved,
        invitation_code_used: invitationCode ?? null,
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return mapLegacyProfile(data as Record<string, unknown>);
  }
}
