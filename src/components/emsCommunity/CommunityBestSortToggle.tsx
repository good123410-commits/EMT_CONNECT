import { Pressable, Text, View } from 'react-native';
import { EMS_LOUNGE_SPACING, useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

type CommunityBestSortToggleProps = {
  active: boolean;
  onPress: () => void;
  /** FlatList 헤더 등 좌우 패딩이 이미 있는 영역 */
  embedded?: boolean;
};

/** 검색창 아래 BEST 정렬 토글 — 케이스·질문함·소통창 공통 */
export function CommunityBestSortToggle({
  active,
  onPress,
  embedded = false,
}: CommunityBestSortToggleProps) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <View
      style={{
        paddingHorizontal: embedded ? 0 : EMS_LOUNGE_SPACING.screen,
        paddingBottom: EMS_LOUNGE_SPACING.headerBottom,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="BEST 정렬"
        accessibilityState={{ selected: active }}
        className="active:opacity-85"
        style={{
          alignSelf: 'flex-start',
          backgroundColor: active ? lounge.accent : lounge.surfaceElevated,
          borderRadius: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: active ? 0 : 1,
          borderColor: lounge.border,
        }}
      >
        <Text
          style={{
            fontFamily: 'Pretendard-Bold',
            fontSize: 11,
            color: active ? '#FFFFFF' : lounge.textSecondary,
          }}
        >
          BEST
        </Text>
      </Pressable>
    </View>
  );
}
