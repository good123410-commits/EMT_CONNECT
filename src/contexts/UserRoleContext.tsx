import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { isValidGuideAdminCode } from '@/constants/adminCodes';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/supabaseClient';
import {
  canAccessHiddenChannel,
  canManageEmergencyGuides,
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
  appRoute: AppRouteKind;
  isDevOverride: boolean;
  /** 응급처치 가이드 관리자 — role=admin 또는 비밀코드 인증 */
  isGuideAdmin: boolean;
  guideAdminVerified: boolean;
  verifyGuideAdminCode: (code: string) => boolean;
  clearGuideAdminVerification: () => void;
  /** 승인된 전문가가 히든 채널 진입 시 true — 일반인 탭 완전 Unmount */
  isExpertMode: boolean;
  enterExpertMode: () => void;
  exitExpertMode: () => void;
};

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

const DEV_ROLE_PRESETS: Record<UserRole, DevRolePreset> = {
  user: { role: 'user', isApproved: false },
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

  const isGuideAdmin = canManageEmergencyGuides(role, guideAdminVerified);

  const setRole = (next: UserRole, options?: { isApproved?: boolean }) => {
    if (!__DEV__) return;

    const preset = DEV_ROLE_PRESETS[next];
    setDevOverride({
      role: next,
      isApproved: options?.isApproved ?? preset.isApproved,
    });

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
      appRoute: resolveAppRoute(role, isApproved),
      isDevOverride: __DEV__ && devOverride !== null,
      isGuideAdmin,
      guideAdminVerified,
      verifyGuideAdminCode,
      clearGuideAdminVerification,
      isExpertMode,
      enterExpertMode,
      exitExpertMode,
    }),
    [role, isApproved, devOverride, isExpertMode, enterExpertMode, exitExpertMode, isGuideAdmin, guideAdminVerified, verifyGuideAdminCode, clearGuideAdminVerification],
  );

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error('useUserRole must be used within UserRoleProvider');
  return context;
}
