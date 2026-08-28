import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { HomeBookmarksSection } from '@/components/home/HomeBookmarksSection';
import { HomeCommerceCuration } from '@/components/home/HomeCommerceCuration';
import { HomeEmergencyTicker } from '@/components/home/HomeEmergencyTicker';
import { HomeEventBannerSection } from '@/components/home/HomeEventBannerSection';
import { HomeLocationSection } from '@/components/home/HomeLocationSection';
import { ThemedScreen } from '@/components/theme/ThemedScreen';
import { APP_SPACING } from '@/constants/appTheme';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useEmergencyTicker } from '@/hooks/useEmergencyTicker';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { subscribeHomeScreenRefresh } from '@/navigation/goHome';

export function HomeScreen() {
  const { banners, commerceItems, loading, refresh } = useHomeDashboard();
  const { items: tickerItems, refresh: refreshTicker } = useEmergencyTicker();
  const { reload: reloadBookmarks } = useBookmarks();
  const fabBottomInset = useGlobalFabBottomInset();
  const [locationRefreshKey, setLocationRefreshKey] = useState(0);

  useEffect(() => {
    return subscribeHomeScreenRefresh(() => {
      void refresh();
      void refreshTicker();
      void reloadBookmarks();
      setLocationRefreshKey((key) => key + 1);
    });
  }, [refresh, refreshTicker, reloadBookmarks]);

  return (
    <ThemedScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: APP_SPACING.contentHorizontal,
          paddingTop: APP_SPACING.screenTop,
          paddingBottom: fabBottomInset,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeEventBannerSection banners={banners} loading={loading} />
        <HomeEmergencyTicker items={tickerItems} />
        <HomeLocationSection refreshKey={locationRefreshKey} />
        <HomeBookmarksSection />
        <HomeCommerceCuration items={commerceItems} loading={loading} />
      </ScrollView>
    </ThemedScreen>
  );
}
