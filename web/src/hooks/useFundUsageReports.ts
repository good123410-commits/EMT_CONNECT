import { useCallback, useEffect, useState } from 'react';
import {
  fetchPublishedFundUsageReports,
  subscribeFundUsageReports,
} from '../services/fundUsageService';
import type { FundUsageReport } from '../types';

export function useFundUsageReports() {
  const [reports, setReports] = useState<FundUsageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await fetchPublishedFundUsageReports();
      setReports(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '기금 사용 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeFundUsageReports(() => void reload());
    return unsubscribe;
  }, [reload]);

  return { reports, loading, error, reload };
}
