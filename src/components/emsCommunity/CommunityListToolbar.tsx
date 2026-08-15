import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { TextInput, View } from 'react-native';
import { LoungeFilterPill, LoungeFilterRow, LoungeTopSection } from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import type { CommunityListSort, CommunitySortOption } from '@/types/communityList';

export type CommunityListToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sort: CommunityListSort;
  onSortChange: (sort: CommunityListSort) => void;
  sortOptions: CommunitySortOption[];
  /** 구인/구직·카테고리 등 추가 필터 행 */
  extraFilters?: ReactNode;
};

/** 커뮤니티 탭 공통 — 키워드 검색 + 정렬 칩 */
export function CommunityListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = '제목·내용 검색',
  sort,
  onSortChange,
  sortOptions,
  extraFilters,
}: CommunityListToolbarProps) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <LoungeTopSection>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: lounge.border,
          backgroundColor: lounge.surface,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 12,
        }}
      >
        <Ionicons name="search" size={18} color={lounge.textMuted} />
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={lounge.textMuted}
          style={{
            flex: 1,
            marginLeft: 8,
            fontFamily: 'Pretendard',
            fontSize: 14,
            color: lounge.text,
            paddingVertical: 0,
          }}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {extraFilters}

      {sortOptions.length > 0 ? (
        <LoungeFilterRow>
          {sortOptions.map((option) => (
            <LoungeFilterPill
              key={option.value}
              label={option.label}
              active={sort === option.value}
              onPress={() => onSortChange(option.value)}
              compact
            />
          ))}
        </LoungeFilterRow>
      ) : null}
    </LoungeTopSection>
  );
}
