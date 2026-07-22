const AUTH_RETURN_KEY = 'kemix-auth-return-to';

function getAppBasePath() {
  if (typeof window === 'undefined') return '';
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

export function getOAuthRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${getAppBasePath()}/auth/callback`;
}

export function getPasswordResetRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${getAppBasePath()}/auth/reset-password`;
}

export function storeAuthReturnPath(path?: string) {
  if (typeof window === 'undefined') return;
  const target = path ?? `${window.location.pathname}${window.location.search}`;
  sessionStorage.setItem(AUTH_RETURN_KEY, target || '/');
}

export function consumeAuthReturnPath(): string {
  if (typeof window === 'undefined') return '/';
  const path = sessionStorage.getItem(AUTH_RETURN_KEY) || '/';
  sessionStorage.removeItem(AUTH_RETURN_KEY);
  return path.startsWith('/') ? path : '/';
}
