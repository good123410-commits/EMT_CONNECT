import { useEffect, useState } from 'react';
import {
  fetchPlatformStats,
  formatStatNumber,
  type PlatformStats,
} from '../services/guideService';

const FALLBACK: PlatformStats = {
  download_count: 0,
  guide_count: 0,
  community_count: 0,
};

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const row = await fetchPlatformStats();
      if (!cancelled) {
        setStats(row);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, formatStatNumber };
}
