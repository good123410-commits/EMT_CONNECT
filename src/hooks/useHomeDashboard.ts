import { useCallback, useEffect, useState } from 'react';
import { fetchActiveHomeEventBanners } from '@/services/homeBannerService';
import {
  getActiveCommerceItems,
  loadHomeCommerceConfig,
  subscribeHomeCommerce,
} from '@/services/homeDashboardService';
import { subscribeHomeEventBanners } from '@/lib/realtimeSubscription';
import type { HomeBanner, HomeCommerceItem } from '@/types/homeDashboard';

export function useHomeDashboard() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [commerceItems, setCommerceItems] = useState<HomeCommerceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBanners = useCallback(async () => {
    try {
      const rows = await fetchActiveHomeEventBanners();
      setBanners(rows);
    } catch {
      setBanners([]);
    }
  }, []);

  const refreshCommerce = useCallback(async () => {
    const config = await loadHomeCommerceConfig();
    setCommerceItems(getActiveCommerceItems(config));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshBanners(), refreshCommerce()]);
    setLoading(false);
  }, [refreshBanners, refreshCommerce]);

  useEffect(() => {
    void refresh();
    const unsubBanners = subscribeHomeEventBanners(() => {
      void refreshBanners();
    });
    const unsubCommerce = subscribeHomeCommerce(() => {
      void refreshCommerce();
    });
    return () => {
      unsubBanners();
      unsubCommerce();
    };
  }, [refresh, refreshBanners, refreshCommerce]);

  return { banners, commerceItems, loading, refresh };
}
