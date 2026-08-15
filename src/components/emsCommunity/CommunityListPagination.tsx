import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import {
  COMMUNITY_LIST_PAGE_SIZE,
  getTotalPages,
  getVisiblePageNumbers,
} from '@/types/communityList';

export type CommunityListPaginationProps = {
  currentPage: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** count 누락 시 현재 페이지가 가득 찼으면 다음 페이지가 있을 수 있음 */
  hasMultiplePages?: boolean;
};

/** 커뮤니티 리스트 하단 [ < 1 2 3 4 5 > ] 페이지 네비게이션 */
export function CommunityListPagination({
  currentPage,
  totalCount,
  pageSize = COMMUNITY_LIST_PAGE_SIZE,
  onPageChange,
  disabled = false,
  hasMultiplePages = false,
}: CommunityListPaginationProps) {
  const { lounge, chip } = useEmsLoungeTheme();
  const safeTotalCount = Number.isFinite(totalCount) ? Math.max(0, totalCount) : 0;
  const safeCurrentPage = Math.max(1, currentPage);
  const totalPages = getTotalPages(safeTotalCount, pageSize);
  const shouldShow = safeTotalCount > 0 && (totalPages > 1 || hasMultiplePages);

  if (__DEV__ && !shouldShow && safeTotalCount > 0) {
    console.log('[CommunityListPagination] hidden', {
      safeTotalCount,
      pageSize,
      totalPages,
      hasMultiplePages,
      currentPage: safeCurrentPage,
    });
  }

  if (!shouldShow) {
    return null;
  }

  const pageNumbers = getVisiblePageNumbers(safeCurrentPage, Math.max(totalPages, safeCurrentPage));
  const canGoPrev = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < totalPages;

  const navButtonStyle = (enabled: boolean) => ({
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: enabled ? lounge.surface : lounge.surfaceElevated,
    borderWidth: 1,
    borderColor: lounge.border,
    opacity: enabled && !disabled ? 1 : 0.45,
  });

  return (
    <View className="items-center py-6">
      <View className="flex-row items-center gap-1.5">
        <Pressable
          style={navButtonStyle(canGoPrev)}
          disabled={!canGoPrev || disabled}
          onPress={() => onPageChange(safeCurrentPage - 1)}
          accessibilityLabel="이전 페이지"
        >
          <Ionicons name="chevron-back" size={18} color={lounge.text} />
        </Pressable>

        {pageNumbers.map((pageNum) => {
          const active = pageNum === safeCurrentPage;
          return (
            <Pressable
              key={pageNum}
              disabled={disabled}
              onPress={() => onPageChange(pageNum)}
              className="active:opacity-85"
              style={{
                minWidth: 36,
                height: 36,
                paddingHorizontal: 10,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? chip.activeBg : chip.inactiveBg,
                borderWidth: active ? 0 : 1,
                borderColor: chip.inactiveBorder,
              }}
              accessibilityLabel={`${pageNum}페이지`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 13,
                  color: active ? chip.activeText : chip.inactiveText,
                }}
              >
                {pageNum}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          style={navButtonStyle(canGoNext)}
          disabled={!canGoNext || disabled}
          onPress={() => onPageChange(safeCurrentPage + 1)}
          accessibilityLabel="다음 페이지"
        >
          <Ionicons name="chevron-forward" size={18} color={lounge.text} />
        </Pressable>
      </View>

      <Text
        style={{
          marginTop: 10,
          fontFamily: 'Pretendard',
          fontSize: 11,
          color: lounge.textMuted,
        }}
      >
        {safeCurrentPage} / {Math.max(totalPages, safeCurrentPage)}페이지 · 총 {safeTotalCount}건
      </Text>
    </View>
  );
}
