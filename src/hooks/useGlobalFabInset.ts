import { useWindowDimensions } from 'react-native';
import { DRAGGABLE_FAB_SIZE, FAB_SCROLL_EXTRA_PADDING } from '@/constants/fabLayout';
import { useFabDragBounds } from '@/hooks/useFabDragBounds';

export {
  DRAGGABLE_FAB_SIZE,
  FAB_GAP_ABOVE_TAB_BAR,
  FAB_SCROLL_EXTRA_PADDING,
  FAB_UTILITIES_BOTTOM_PADDING,
} from '@/constants/fabLayout';

/** 스크롤 콘텐츠 하단 여백 — 드래그 FAB·탭 바 가림 방지 */
export function useGlobalFabBottomInset(): number {
  const { height: screenHeight } = useWindowDimensions();
  const bounds = useFabDragBounds();

  const reservedBottom = screenHeight - bounds.maxY - DRAGGABLE_FAB_SIZE + FAB_SCROLL_EXTRA_PADDING;
  return Math.max(reservedBottom, 16);
}
