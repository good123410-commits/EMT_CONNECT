import { ActivityIndicator, View } from 'react-native';
import { HomeEmptyStateBox } from '@/components/home/HomeEmptyStateBox';
import { HomeEventBannerList } from '@/components/home/HomeEventBannerList';
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { HomeBanner } from '@/types/homeDashboard';

type HomeEventBannerSectionProps = {
  banners: HomeBanner[];
  loading?: boolean;
};

export function HomeEventBannerSection({ banners, loading = false }: HomeEventBannerSectionProps) {
  const { colors } = useThemedColors();

  return (
    <View style={{ marginBottom: 20 }}>
      <HomeSectionHeader
        title="이벤트 · 공지"
        subtitle="KEMIX 소식과 이벤트를 확인하세요"
      />

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color={colors.blue} />
        </View>
      ) : banners.length > 0 ? (
        <HomeEventBannerList banners={banners} embedded />
      ) : (
        <HomeEmptyStateBox message="등록된 이벤트 배너가 없습니다." icon="images-outline" />
      )}
    </View>
  );
}
