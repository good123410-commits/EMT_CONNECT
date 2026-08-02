import * as Linking from 'expo-linking';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_BORDER, APP_COLORS, APP_RADIUS, APP_SHADOW } from '@/constants/appTheme';
import type { HomeCommerceItem } from '@/types/homeDashboard';

type HomeCommerceCurationProps = {
  items: HomeCommerceItem[];
};

const CARD_GAP = 12;
const THUMB_SIZE = 96;

export function HomeCommerceCuration({ items }: HomeCommerceCurationProps) {
  const openPartnerLink = async (item: HomeCommerceItem) => {
    const url = item.partnerUrl.trim();
    if (!url) {
      Alert.alert('준비 중', '제휴 링크가 곧 연결됩니다.');
      return;
    }
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('링크 오류', '제휴 링크를 열 수 없습니다.');
      return;
    }
    await Linking.openURL(url);
  };

  if (items.length === 0) return null;

  return (
    <View>
      <Text
        className="mb-4"
        style={{ fontFamily: 'Pretendard-Bold', color: APP_COLORS.textPrimary, fontSize: 20, lineHeight: 28 }}
      >
        응급·건강 케어
      </Text>

      <View style={{ gap: CARD_GAP, width: '100%' }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            className="w-full bg-kemix-surface active:opacity-90"
            style={{
              borderRadius: APP_RADIUS.card,
              ...APP_SHADOW.cardSoft,
              ...APP_BORDER.card,
            }}
            onPress={() => void openPartnerLink(item)}
          >
            <View className="flex-row">
              <View
                className="items-center justify-center overflow-hidden"
                style={{
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  backgroundColor: APP_COLORS.blueMuted,
                  borderTopLeftRadius: APP_RADIUS.card,
                  borderBottomLeftRadius: APP_RADIUS.card,
                }}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: APP_COLORS.surface }}
                  >
                    <AppIcon name="shopping-outline" size={28} color={APP_COLORS.blue} />
                  </View>
                )}
              </View>

              <View className="flex-1" style={{ padding: 20 }}>
                <Text
                  className="text-[14px] leading-5"
                  numberOfLines={2}
                  style={{ fontFamily: 'Pretendard-SemiBold', color: APP_COLORS.navy }}
                >
                  {item.title}
                </Text>
                <Text
                  className="mt-1.5 text-[12px] leading-5"
                  numberOfLines={3}
                  style={{ fontFamily: 'Pretendard', color: APP_COLORS.textSecondary }}
                >
                  {item.description}
                </Text>
                <View
                  className="mt-2 flex-row items-center justify-between"
                  style={{
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: APP_COLORS.borderLight,
                  }}
                >
                  <Text
                    className="text-[11px] leading-4"
                    style={{ fontFamily: 'Pretendard-Medium', color: APP_COLORS.blue }}
                  >
                    {item.partnerLabel}
                  </Text>
                  <AppIcon name="chevron-right" size={16} color={APP_COLORS.textMuted} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <Text
        className="mt-4 text-[11px] leading-5"
        style={{ fontFamily: 'Pretendard', color: APP_COLORS.textMuted }}
      >
        쿠팡 파트너스 등 제휴 링크는 구매 추천이며 의료 행위·처방을 대체하지 않습니다.
      </Text>
    </View>
  );
}
