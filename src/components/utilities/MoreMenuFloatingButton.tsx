import { AppIcon } from '@/components/ui/AppIcon';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS, APP_SHADOW } from '@/constants/appTheme';
import { useMoreMenu } from '@/contexts/MoreMenuContext';

type MoreMenuFloatingButtonProps = {
  bottomOffset?: number;
};

/** 하단 탭 위 플로팅 '더보기' 버튼 — Main 화면에서 독립 호출 */
export function MoreMenuFloatingButton({ bottomOffset = 64 }: MoreMenuFloatingButtonProps) {
  const insets = useSafeAreaInsets();
  const { openMoreMenu } = useMoreMenu();

  return (
    <View
      pointerEvents="box-none"
      className="absolute right-5 z-50"
      style={{ bottom: bottomOffset + insets.bottom }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="더보기 메뉴"
        className="flex-row items-center rounded-full bg-kemix-surface px-4 py-3 active:opacity-90"
        style={{
          borderWidth: 1,
          borderColor: APP_COLORS.border,
          ...APP_SHADOW.float,
        }}
        onPress={openMoreMenu}
      >
        <AppIcon name="dots-grid" size={18} color={APP_COLORS.tabActive} />
        <Text
          className="ml-1.5 text-[14px] leading-5"
          style={{ fontFamily: 'Pretendard-SemiBold', color: APP_COLORS.navy }}
        >
          더보기
        </Text>
      </Pressable>
    </View>
  );
}
