import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
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
  const scale = useSharedValue(1);
  const bookmarked = isBookmarked(item.id);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.22, { damping: 8, stiffness: 320 }),
      withSpring(1, { damping: 12, stiffness: 260 }),
    );
    toggleBookmark(item);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ??
        (bookmarked ? `${item.title} 즐겨찾기 해제` : `${item.title} 즐겨찾기 추가`)
      }
      hitSlop={hitSlop}
      style={style}
      onPress={handlePress}
    >
      <Animated.View style={animatedStyle}>
        <AppIcon
          name={bookmarked ? 'star' : 'star-outline'}
          size={size}
          color={bookmarked ? activeColor ?? '#FBBF24' : inactiveColor ?? colors.textMuted}
        />
      </Animated.View>
    </Pressable>
  );
}
