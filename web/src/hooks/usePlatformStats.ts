import { useEffect, useState } from 'react';
import {
  fetchPlatformStats,
  formatStatNumber,
  type PlatformStats,
} from '../services/guideService';

const FALLBACK: PlatformStats = {
  hospital_count: 2968,
  guide_count: 0,
  active_paramedic_count: 0,
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
