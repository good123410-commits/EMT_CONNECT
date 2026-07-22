import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/lib/supabaseClient';
import { fetchProfile } from '@/services/profileService';
import { isApprovedDbAdmin } from '@/utils/expertSettingsAccess';

/** auth.uid() 기준 user_profiles 실시간 조회 */
export function useLiveDbAdmin() {
  const { user, refreshProfile } = useAuth();
  const [liveProfile, setLiveProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user?.id) {
      setLiveProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await fetchProfile(user.id);
      setLiveProfile(profile);
      await refreshProfile();
    } catch {
      setLiveProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, refreshProfile]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isDbAdmin = liveProfile
    ? isApprovedDbAdmin(liveProfile.role, liveProfile.is_approved)
    : false;

  return {
    userId: user?.id ?? null,
    userEmail: user?.email ?? liveProfile?.email ?? null,
    liveProfile,
    isDbAdmin,
    loading,
    reload,
  };
}
