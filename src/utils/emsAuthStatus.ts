import type { EmtVerification, UserProfile } from '@/lib/supabaseClient';
import { canAccessParamedicSpace } from '@/utils/membershipRbac';

export type EmsAuthStatus = 'none' | 'pending' | 'code_required' | 'verified';

export function resolveEmsAuthStatus(
  profile: UserProfile | null,
  verification: EmtVerification | null,
): EmsAuthStatus {
  if (!profile) return 'none';

  const stored = profile.auth_status;
  if (
    stored === 'none' ||
    stored === 'pending' ||
    stored === 'code_required' ||
    stored === 'verified'
  ) {
    if (stored === 'verified' || canAccessParamedicSpace(profile.role, profile.is_approved)) {
      return 'verified';
    }
    return stored;
  }

  if (canAccessParamedicSpace(profile.role, profile.is_approved)) {
    return 'verified';
  }

  if (verification?.status === 'pending' && verification.document_url !== 'code-only') {
    return 'pending';
  }

  if (verification?.status === 'approved' && !profile.is_approved) {
    return 'code_required';
  }

  return 'none';
}
