import { useCallback, useEffect, useState } from 'react';
import {
  fetchActiveDonationAccounts,
  subscribeDonationAccounts,
} from '../services/donationService';
import type { DonationAccount } from '../types';

export function useDonationAccounts() {
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await fetchActiveDonationAccounts();
      setAccounts(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '계좌 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeDonationAccounts(() => void reload());
    return unsubscribe;
  }, [reload]);

  return { accounts, loading, error, reload };
}
