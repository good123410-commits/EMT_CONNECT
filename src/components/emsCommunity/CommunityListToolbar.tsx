import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';
import { LoungeTopSection } from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

export type CommunityListToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** FlatList ListHeaderComponent 등 이미 좌우 패딩이 있는 영역 */
  embedded?: boolean;
};

/** 커뮤니티 탭 공통 — 키워드 검색 */
export function CommunityListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = '제목·내용 검색',
  embedded = false,
}: CommunityListToolbarProps) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <LoungeTopSection embedded={embedded}>
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
    </LoungeTopSection>
  );
}
