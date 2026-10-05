import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { BookmarkInput } from '@/types/bookmark';

type BookmarkButtonProps = {
  item: BookmarkInput;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  accessibilityLabel?: string;
};

/** Web: Reanimated 스케일 애니메이션 없이 동일 동작 */
export function BookmarkButton({
  item,
  size = 22,
  activeColor,
  inactiveColor,
  style,
  hitSlop = 10,
  accessibilityLabel,
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { colors } = useThemedColors();
  const bookmarked = isBookmarked(item.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ??
        (bookmarked ? `${item.title} 즐겨찾기 해제` : `${item.title} 즐겨찾기 추가`)
      }
      hitSlop={hitSlop}
      style={style}
      onPress={() => toggleBookmark(item)}
    >
      <AppIcon
        name={bookmarked ? 'star' : 'star-outline'}
        size={size}
        color={bookmarked ? activeColor ?? '#FBBF24' : inactiveColor ?? colors.textMuted}
      />
    </Pressable>
  );
}
