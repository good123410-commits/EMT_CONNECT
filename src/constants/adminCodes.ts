/** 응급처치 가이드 관리자 비밀코드 (대소문자 무시) */
export const GUIDE_ADMIN_SECRET_CODES = ['EMS-ADMIN-GUIDE', 'GUIDE-ADMIN-2026'] as const;

export function isValidGuideAdminCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return GUIDE_ADMIN_SECRET_CODES.some((entry) => entry === normalized);
}
