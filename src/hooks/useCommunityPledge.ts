import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  acceptCommunityPledge,
  hasAcceptedCommunityPledge,
} from '@/services/paramedicCommunityService';

export function useCommunityPledge() {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setAccepted(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ok = await hasAcceptedCommunityPledge(user.id);
      setAccepted(ok);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const acceptPledge = useCallback(async () => {
    if (!user?.id) return false;
    await acceptCommunityPledge(user.id);
    setAccepted(true);
    return true;
  }, [user?.id]);

  return { accepted, loading, acceptPledge, refresh };
}
