import { useCallback, useEffect, useState } from 'react';
import {
  fetchPublishedKemixResources,
  subscribeKemixResources,
} from '@/services/kemixResourceService';
import type { KemixResource } from '@/types/kemixResource';

export function useKemixResources() {
  const [resources, setResources] = useState<KemixResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await fetchPublishedKemixResources();
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
    const unsubscribe = subscribeKemixResources(() => void reload());
    return unsubscribe;
  }, [reload]);

  return { resources, loading, error, reload };
}
