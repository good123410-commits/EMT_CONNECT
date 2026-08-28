import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { HomeEmptyStateBox } from '@/components/home/HomeEmptyStateBox';
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useThemedColors } from '@/hooks/useThemedColors';
import { navigateToBookmarkTarget } from '@/utils/bookmarkNavigation';
import { KEMIX_TOUCH_MIN_HEIGHT } from '@/theme/kemixSemantic';
import type { BookmarkItem } from '@/types/bookmark';

function BookmarkShortcutTile({ item }: { item: BookmarkItem }) {
  const { colors } = useThemedColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title} 바로가기`}
      className="flex-1 active:opacity-85"
      style={{
        minHeight: KEMIX_TOUCH_MIN_HEIGHT + 8,
        borderRadius: APP_RADIUS.sm + 2,
        backgroundColor: colors.surfaceElevated,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
      onPress={() => navigateToBookmarkTarget(item.target)}
    >
      <View
        className="items-center justify-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: item.iconBg,
        }}
      >
        <AppIcon name={item.icon} size={20} color={item.iconColor} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="text-kemix-text"
          numberOfLines={1}
          style={{ fontFamily: APP_FONT.semibold, fontSize: 15, lineHeight: 20 }}
        >
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text
            className="mt-0.5 text-kemix-muted"
            numberOfLines={1}
            style={{ fontFamily: APP_FONT.regular, fontSize: 12, lineHeight: 16 }}
          >
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function chunkBookmarks(items: BookmarkItem[], size: number): BookmarkItem[][] {
  const rows: BookmarkItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

export function HomeBookmarksSection() {
  const { bookmarks, loading } = useBookmarks();
  const { colors } = useThemedColors();
  const rows = useMemo(() => chunkBookmarks(bookmarks, 2), [bookmarks]);

  return (
    <View style={{ marginBottom: 20 }}>
      <HomeSectionHeader
        title="즐겨찾기"
        subtitle="자주 쓰는 메뉴를 빠르게 열어보세요"
      />

      {loading ? (
        <View className="items-center py-8">
          <ActivityIndicator color={colors.blue} />
        </View>
      ) : bookmarks.length > 0 ? (
        <View style={{ gap: 8 }}>
          {rows.map((row, rowIndex) => (
            <View key={`bookmark-row-${rowIndex}`} className="flex-row" style={{ gap: 8 }}>
              {row.map((item) => (
                <BookmarkShortcutTile key={item.id} item={item} />
              ))}
              {row.length === 1 ? <View className="flex-1" /> : null}
            </View>
          ))}
        </View>
      ) : (
        <HomeEmptyStateBox
          message="등록된 즐겨찾기가 없습니다. 메뉴의 별 아이콘으로 추가해 보세요."
          icon="star-outline"
        />
      )}
    </View>
  );
}
