import { isAdminRole } from './roles';

const BOOTSTRAP_ADMIN_EMAILS = (
  import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAILS ?? 'good1285@good1285.com'
)
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return BOOTSTRAP_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function isApprovedAdmin(
  profile: { role: string; is_approved?: boolean; is_blocked?: boolean } | null,
  email?: string | null,
): boolean {
  if (profile?.is_blocked) return false;

  if (isBootstrapAdminEmail(email)) {
    return true;
  }

  if (profile?.is_approved && isAdminRole(profile.role)) {
    return true;
  }

  return false;
}
