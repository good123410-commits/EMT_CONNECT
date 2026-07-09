import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ProfileRole } from '@/lib/supabaseClient';

type UserRoleContextValue = {
  role: ProfileRole;
  setRole: (role: ProfileRole) => void;
  isProUser: boolean;
  isDevOverride: boolean;
};

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const [devOverride, setDevOverride] = useState<ProfileRole | null>(null);

  const serverRole: ProfileRole = profile?.role ?? 'public';
  const role = __DEV__ && devOverride !== null ? devOverride : serverRole;

  useEffect(() => {
    if (profile?.role === 'emt_certified') {
      setDevOverride(null);
    }
  }, [profile?.role]);

  const setRole = (next: ProfileRole) => {
    if (__DEV__) {
      setDevOverride(next);
    }
    void refreshProfile();
  };

  const value = useMemo(
    () => ({
      role,
      setRole,
      isProUser: role === 'emt_certified',
      isDevOverride: __DEV__ && devOverride !== null,
    }),
    [role, devOverride, refreshProfile],
  );

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error('useUserRole must be used within UserRoleProvider');
  return context;
}
