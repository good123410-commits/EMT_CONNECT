import type { ReactNode } from 'react';
import { View } from 'react-native';
import { CommunityListToolbar } from '@/components/emsCommunity/CommunityListToolbar';
import { CommunityBestSortToggle } from '@/components/emsCommunity/CommunityBestSortToggle';
import { LoungeErrorBanner } from '@/components/emsCommunity/loungeUi';

type CommunityListScrollHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  error?: string | null;
  /** BEST(인기순) 정렬 토글 */
  bestActive?: boolean;
  onBestToggle?: () => void;
  children?: ReactNode;
};

/** FlatList ListHeaderComponent — 검색·필터·오류와 함께 스크롤 */
export function CommunityListScrollHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  error,
  bestActive,
  onBestToggle,
  children,
}: CommunityListScrollHeaderProps) {
  const showSearch = onSearchChange !== undefined;

  return (
    <View>
      {showSearch ? (
        <CommunityListToolbar
          embedded
          searchValue={searchValue ?? ''}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
        />
      ) : null}

      {onBestToggle ? (
        <CommunityBestSortToggle embedded active={Boolean(bestActive)} onPress={onBestToggle} />
      ) : null}

      {error ? (
        <View className="mb-2">
          <LoungeErrorBanner message={error} embedded />
        </View>
      ) : null}

      {children}
    </View>
  );
}
