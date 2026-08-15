import * as Linking from 'expo-linking';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { StatusPill } from '@/components/ui/StatusPill';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import { KEMIX_TOUCH_MIN_HEIGHT } from '@/theme/kemixSemantic';
import type { HomeCommerceItem } from '@/types/homeDashboard';

type HomeCareListCardProps = {
  item: HomeCommerceItem;
  onPress: () => void;
};

const THUMB_SIZE = 56;

export function HomeCareListCard({ item, onPress }: HomeCareListCardProps) {
  const { colors, semantic } = useThemedColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.description}`}
      className="w-full active:opacity-90"
      style={{
        minHeight: KEMIX_TOUCH_MIN_HEIGHT,
        borderRadius: APP_RADIUS.sm + 2,
        backgroundColor: colors.surfaceElevated,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View
          className="items-center justify-center overflow-hidden"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: 12,
            backgroundColor: colors.blueMuted,
          }}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              resizeMode="cover"
            />
          ) : (
            <AppIcon name="shopping-outline" size={22} color={colors.blue} />
          )}
        </View>

        <View className="ml-3 min-w-0 flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className="flex-1 text-kemix-text"
              numberOfLines={1}
              style={{ fontFamily: APP_FONT.semibold, fontSize: 15, lineHeight: 20 }}
            >
              {item.title}
            </Text>
            <AppIcon name="chevron-right" size={18} color={semantic.mutedText} />
          </View>

          <Text
            className="mt-0.5 text-kemix-text-secondary"
            numberOfLines={1}
            style={{ fontFamily: APP_FONT.regular, fontSize: 13, lineHeight: 18 }}
          >
            {item.description}
          </Text>

          <View className="mt-1.5">
            <StatusPill label={item.partnerLabel} tone="neutral" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export async function openHomeCarePartnerLink(item: HomeCommerceItem): Promise<void> {
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
}
