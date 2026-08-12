import { ScrollView, View } from 'react-native';
import { HomeCommerceCuration } from '@/components/home/HomeCommerceCuration';
import { HomeEventBannerList } from '@/components/home/HomeEventBannerList';
import { ThemedScreen } from '@/components/theme/ThemedScreen';
import { APP_SPACING } from '@/constants/appTheme';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';

const BANNER_TO_CURATION_GAP = 24;

export function HomeScreen() {
  const { banners, commerceItems } = useHomeDashboard();
  const hasBanners = banners.length > 0;
  const fabBottomInset = useGlobalFabBottomInset();

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
        {hasBanners ? (
          <View style={{ marginBottom: BANNER_TO_CURATION_GAP }}>
            <HomeEventBannerList banners={banners} />
          </View>
        ) : null}

        {/* DISABLED: 비상연락망 & 응급카드 (ICE) */}
        {/* <View className="mb-6">
          <EmergencyOverlayToggleCard compact />
        </View> */}

        <HomeCommerceCuration items={commerceItems} />
      </ScrollView>
    </ThemedScreen>
  );
}
