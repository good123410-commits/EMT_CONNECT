/** 플로팅 더보기 FAB 레이아웃 상수 */
export const DRAGGABLE_FAB_SIZE = 56;

/** 탭 바 상단과 FAB 하단 사이 최소 여백 */
export const FAB_MARGIN_ABOVE_TAB_BAR = 10;

/** 헤더 하단과 FAB 상단 사이 최소 여백 */
export const FAB_MARGIN_BELOW_HEADER = 12;

/** 좌우 safe area 안쪽 여백 */
export const FAB_HORIZONTAL_MARGIN = 12;

/** 탭 바 없는 풀스크린(설정·유틸 등) 하단 여백 */
export const FAB_OVERLAY_BOTTOM_PADDING = 20;

/** 스크롤 콘텐츠 하단 여백 — FAB·탭 바 가림 방지 */
export const FAB_SCROLL_EXTRA_PADDING = 24;

/** @deprecated FAB_MARGIN_ABOVE_TAB_BAR + 탭 높이로 대체 */
export const FAB_GAP_ABOVE_TAB_BAR = 80;

/** @deprecated FAB_OVERLAY_BOTTOM_PADDING 사용 */
export const FAB_UTILITIES_BOTTOM_PADDING = 28;

export const FAB_DRAG_SPRING = {
  damping: 22,
  stiffness: 320,
  mass: 0.75,
} as const;

export const FAB_SNAP_SPRING = {
  damping: 20,
  stiffness: 280,
  mass: 0.7,
} as const;
