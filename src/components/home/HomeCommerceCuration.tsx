import { ActivityIndicator, Text, View } from 'react-native';
import { HomeCareListCard, openHomeCarePartnerLink } from '@/components/home/HomeCareListCard';
import { HomeEmptyStateBox } from '@/components/home/HomeEmptyStateBox';
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader';
import { APP_FONT } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { HomeCommerceItem } from '@/types/homeDashboard';

type HomeCommerceCurationProps = {
  items: HomeCommerceItem[];
  loading?: boolean;
};

const CARD_GAP = 8;

export function HomeCommerceCuration({ items, loading = false }: HomeCommerceCurationProps) {
  const { colors } = useThemedColors();

  return (
    <View>
      <HomeSectionHeader
        title="응급·건강 케어"
        subtitle="가정 상비·응급 준비 (의료 행위·처방 대체 아님)"
      />

      {loading ? (
        <View className="items-center py-8">
          <ActivityIndicator color={colors.blue} />
        </View>
      ) : items.length > 0 ? (
        <>
          <View style={{ gap: CARD_GAP, width: '100%' }}>
            {items.map((item) => (
              <HomeCareListCard
                key={item.id}
                item={item}
                onPress={() => void openHomeCarePartnerLink(item)}
              />
            ))}
          </View>

          <Text
            className="mt-3 text-kemix-muted"
            style={{ fontFamily: APP_FONT.regular, fontSize: 11, lineHeight: 16 }}
          >
            제휴 링크는 구매 추천이며 의료 행위·처방을 대체하지 않습니다.
          </Text>
        </>
      ) : (
        <HomeEmptyStateBox message="등록된 큐레이션 콘텐츠가 없습니다." icon="cart-outline" />
      )}
    </View>
  );
}
