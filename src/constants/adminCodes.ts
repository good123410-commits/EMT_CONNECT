/** 응급처치 가이드 관리자 비밀코드 (대소문자 무시) */
export const GUIDE_ADMIN_SECRET_CODES = ['EMS-ADMIN-GUIDE', 'GUIDE-ADMIN-2026'] as const;

/** 설정 > 관리자 모드 진입 비밀코드 */
export const OPS_ADMIN_SECRET_CODES = ['EMS-ADMIN-OPS', 'EMS-CONNECT-ADMIN', 'ADMIN-2026'] as const;

export function isValidGuideAdminCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return GUIDE_ADMIN_SECRET_CODES.some((entry) => entry === normalized);
}

export function isValidOpsAdminCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return OPS_ADMIN_SECRET_CODES.some((entry) => entry === normalized);
}
