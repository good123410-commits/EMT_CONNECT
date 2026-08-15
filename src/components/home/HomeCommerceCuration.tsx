import { Text, View } from 'react-native';
import { HomeCareListCard, openHomeCarePartnerLink } from '@/components/home/HomeCareListCard';
import { APP_FONT } from '@/constants/appTheme';
import type { HomeCommerceItem } from '@/types/homeDashboard';

type HomeCommerceCurationProps = {
  items: HomeCommerceItem[];
};

const CARD_GAP = 8;

export function HomeCommerceCuration({ items }: HomeCommerceCurationProps) {
  if (items.length === 0) return null;

  return (
    <View>
      <Text
        className="mb-1 text-kemix-text"
        style={{ fontFamily: APP_FONT.semibold, fontSize: 17, lineHeight: 24 }}
      >
        응급·건강 케어
      </Text>
      <Text
        className="mb-3 text-kemix-muted"
        style={{ fontFamily: APP_FONT.regular, fontSize: 12, lineHeight: 17 }}
      >
        가정 상비·응급 준비 (의료 행위·처방 대체 아님)
      </Text>

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
    </View>
  );
}
