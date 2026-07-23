import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { isValidGuideAdminCode, isValidOpsAdminCode } from '@/constants/adminCodes';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/supabaseClient';
import { updateProfileRole } from '@/services/profileService';
import {
  canAccessHiddenChannel,
  canAccessParamedicChannel,
  canManageEmergencyGuides,
  isApprovedParamedic,
  isExpertRole,
  resolveAppRoute,
  type AppRouteKind,
} from '@/utils/roleAccess';

type DevRolePreset = {
  role: UserRole;
  isApproved: boolean;
};

type UserRoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole, options?: { isApproved?: boolean }) => void;
  isApproved: boolean;
  isExpert: boolean;
  canAccessHidden: boolean;
  /** 구급대원 채널 — paramedic+승인, admin+승인, 운영 관리자 코드 */
  isApprovedParamedic: boolean;
  canAccessParamedicChannel: boolean;
  appRoute: AppRouteKind;
  isDevOverride: boolean;
  /** 응급처치 가이드 관리자 — role=admin 또는 비밀코드 인증 */
  isGuideAdmin: boolean;
  guideAdminVerified: boolean;
  verifyGuideAdminCode: (code: string) => boolean;
  clearGuideAdminVerification: () => void;
  /** 설정 > 관리자 모드 — DB admin 또는 운영 비밀코드 */
  opsAdminVerified: boolean;
  verifyOpsAdminCode: (code: string) => boolean;
  clearOpsAdminVerification: () => void;
  /** 승인된 전문가가 히든 채널 진입 시 true — 일반인 탭 완전 Unmount */
  isExpertMode: boolean;
  enterExpertMode: () => void;
  exitExpertMode: () => void;
};

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

const DEV_ROLE_PRESETS: Record<UserRole, DevRolePreset> = {
  user: { role: 'user', isApproved: false },
  associate_member: { role: 'associate_member', isApproved: true },
  regular_member: { role: 'regular_member', isApproved: true },
  super_admin: { role: 'super_admin', isApproved: true },
  sub_admin: { role: 'sub_admin', isApproved: true },
  hospital: { role: 'hospital', isApproved: true },
  paramedic: { role: 'paramedic', isApproved: true },
  private_ems: { role: 'private_ems', isApproved: true },
  admin: { role: 'admin', isApproved: true },
};

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [devOverride, setDevOverride] = useState<DevRolePreset | null>(null);
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [guideAdminVerified, setGuideAdminVerified] = useState(false);
  const [opsAdminVerified, setOpsAdminVerified] = useState(false);

  const serverRole: UserRole = profile?.role ?? 'user';
  const serverApproved = profile?.is_approved ?? false;

  const role = __DEV__ && devOverride ? devOverride.role : serverRole;
  const isApproved = __DEV__ && devOverride ? devOverride.isApproved : serverApproved;

  const enterExpertMode = useCallback(() => setIsExpertMode(true), []);
  const exitExpertMode = useCallback(() => setIsExpertMode(false), []);

  const verifyGuideAdminCode = useCallback((code: string) => {
    const ok = isValidGuideAdminCode(code);
    if (ok) setGuideAdminVerified(true);
    return ok;
  }, []);

  const clearGuideAdminVerification = useCallback(() => {
    setGuideAdminVerified(false);
  }, []);

  const verifyOpsAdminCode = useCallback((code: string) => {
    const ok = isValidOpsAdminCode(code);
    if (ok) setOpsAdminVerified(true);
    return ok;
  }, []);

  const clearOpsAdminVerification = useCallback(() => {
    setOpsAdminVerified(false);
  }, []);

  const isGuideAdmin = canManageEmergencyGuides(role, guideAdminVerified);

  const setRole = (next: UserRole, options?: { isApproved?: boolean }) => {
    if (!__DEV__) return;

    const preset = DEV_ROLE_PRESETS[next];
    const approved = options?.isApproved ?? preset.isApproved;

    setDevOverride({
      role: next,
      isApproved: approved,
    });

    if (profile?.id) {
      void updateProfileRole(profile.id, next, undefined, approved).catch(() => undefined);
    }

    if (isExpertRole(next)) {
      setIsExpertMode(true);
    } else {
      setIsExpertMode(false);
    }
  };

  const value = useMemo(
    () => ({
      role,
      setRole,
      isApproved,
      isExpert: isExpertRole(role),
      canAccessHidden: canAccessHiddenChannel(role, isApproved),
      isApprovedParamedic: isApprovedParamedic(role, isApproved),
      canAccessParamedicChannel: canAccessParamedicChannel(role, isApproved, opsAdminVerified),
      appRoute: resolveAppRoute(role, isApproved),
      isDevOverride: __DEV__ && devOverride !== null,
      isGuideAdmin,
      guideAdminVerified,
      verifyGuideAdminCode,
      clearGuideAdminVerification,
      opsAdminVerified,
      verifyOpsAdminCode,
      clearOpsAdminVerification,
      isExpertMode,
      enterExpertMode,
      exitExpertMode,
    }),
    [role, isApproved, devOverride, isExpertMode, enterExpertMode, exitExpertMode, isGuideAdmin, guideAdminVerified, verifyGuideAdminCode, clearGuideAdminVerification, opsAdminVerified, verifyOpsAdminCode, clearOpsAdminVerification],
  );

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error('useUserRole must be used within UserRoleProvider');
  return context;
}
