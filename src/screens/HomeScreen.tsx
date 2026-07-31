import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeCommerceCuration } from '@/components/home/HomeCommerceCuration';
import { HomeEventBannerList } from '@/components/home/HomeEventBannerList';
import { EmergencyOverlayToggleCard } from '@/components/utilities/EmergencyOverlayToggleCard';
import { APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

const BANNER_TO_CURATION_GAP = 24;

export function HomeScreen() {
  const { banners, commerceItems } = useHomeDashboard();
  const hasBanners = banners.length > 0;

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: APP_COLORS.background }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: APP_SPACING.screen,
          paddingTop: APP_SPACING.screenTop,
          paddingBottom: 96,
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
    </SafeAreaView>
  );
}
