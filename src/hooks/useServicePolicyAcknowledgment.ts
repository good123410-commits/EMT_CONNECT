import { useCallback, useEffect, useState } from 'react';
import {
  acknowledgeServicePolicy,
  hasAcknowledgedServicePolicy,
} from '@/services/servicePolicyService';

export function useServicePolicyAcknowledgment() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const ok = await hasAcknowledgedServicePolicy();
      setAcknowledged(ok);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const acceptPolicy = useCallback(async () => {
    await acknowledgeServicePolicy();
    setAcknowledged(true);
    return true;
  }, []);

  return { acknowledged, loading, acceptPolicy, refresh };
}
