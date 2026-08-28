import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

export type CommunityBestSectionProps<T> = {
  title?: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyFallback?: ReactNode;
};

/**
 * [BEST] 스포트라이트 영역 — 메인 리스트와 분리된 상위 콘텐츠 슬롯.
 * 향후 별도 카테고리·추천 알고리즘으로 확장할 수 있다.
 */
export function CommunityBestSection<T>({
  title = 'BEST',
  items,
  renderItem,
  emptyFallback = null,
}: CommunityBestSectionProps<T>) {
  const { lounge } = useEmsLoungeTheme();

  if (items.length === 0) {
    return emptyFallback;
  }

  return (
    <View>
      <View className="mb-3 flex-row items-center gap-2">
        <View
          style={{
            backgroundColor: lounge.accent,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ fontFamily: 'Pretendard-Bold', fontSize: 11, color: '#FFFFFF' }}>
            {title}
          </Text>
        </View>
      </View>
      {items.map((item) => (
        <View key={String((item as { id?: string }).id ?? Math.random())}>{renderItem(item)}</View>
      ))}
    </View>
  );
}
