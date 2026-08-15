import { useCallback, useRef } from 'react';
import type { FlatList } from 'react-native';

/** 페이지 변경 시 FlatList 상단으로 스크롤 */
export function useCommunityListScrollToTop<T>() {
  const listRef = useRef<FlatList<T>>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  return { listRef, scrollToTop };
}
