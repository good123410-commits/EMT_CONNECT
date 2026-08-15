import { ActivityIndicator, ScrollView, View } from 'react-native';
import { HomeCommerceCuration } from '@/components/home/HomeCommerceCuration';
import { HomeEmergencyHero } from '@/components/home/HomeEmergencyHero';
import { HomeEventBannerList } from '@/components/home/HomeEventBannerList';
import { ThemedScreen } from '@/components/theme/ThemedScreen';
import { APP_SPACING } from '@/constants/appTheme';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { useThemedColors } from '@/hooks/useThemedColors';

export function HomeScreen() {
  const { banners, commerceItems, loading } = useHomeDashboard();
  const fabBottomInset = useGlobalFabBottomInset();
  const { colors } = useThemedColors();
  const hasBanners = banners.length > 0;

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
        {hasBanners ? <HomeEventBannerList banners={banners} /> : null}

        <HomeEmergencyHero />

        {loading ? (
          <View className="items-center py-6">
            <ActivityIndicator color={colors.blue} />
          </View>
        ) : (
          <HomeCommerceCuration items={commerceItems} />
        )}
      </ScrollView>
    </ThemedScreen>
  );
}
