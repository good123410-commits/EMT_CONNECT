import { ScrollView, View } from 'react-native';
import { HomeCommerceCuration } from '@/components/home/HomeCommerceCuration';
import { HomeEventBannerList } from '@/components/home/HomeEventBannerList';
import { EmergencyOverlayToggleCard } from '@/components/utilities/EmergencyOverlayToggleCard';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

const BANNER_TO_CURATION_GAP = 24;

export function HomeScreen() {
  const { banners, commerceItems } = useHomeDashboard();
  const hasBanners = banners.length > 0;
  const fabBottomInset = useGlobalFabBottomInset();

  return (
    <View className="flex-1" style={{ backgroundColor: APP_COLORS.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: APP_SPACING.screen,
          paddingTop: APP_SPACING.screenTop,
          paddingBottom: fabBottomInset,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {hasBanners ? (
          <View style={{ marginBottom: BANNER_TO_CURATION_GAP }}>
            <HomeEventBannerList banners={banners} />
          </View>
        ) : null}

        <View className="mb-6">
          <EmergencyOverlayToggleCard compact />
        </View>

        <HomeCommerceCuration items={commerceItems} />
      </ScrollView>
    </View>
  );
}
