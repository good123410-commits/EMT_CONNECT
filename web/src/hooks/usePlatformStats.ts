import { useEffect, useState } from 'react';
import {
  fetchPlatformStats,
  formatStatNumber,
  recordSiteVisit,
  type PlatformStats,
} from '../services/guideService';

const FALLBACK: PlatformStats = {
  download_count: 0,
  guide_count: 0,
  member_count: 0,
  today_visitor_count: 0,
};

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await recordSiteVisit();
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
