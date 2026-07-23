import { useCallback, useEffect, useState } from 'react';
import { fetchPublishedResources, subscribeResources } from '../services/resourceService';
import type { KemixResource } from '../types';

export function useResources() {
  const [resources, setResources] = useState<KemixResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await fetchPublishedResources();
      setResources(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '자료를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeResources(() => void reload());
    return unsubscribe;
  }, [reload]);

  return { resources, loading, error, reload };
}
