import { useEffect, type DependencyList } from 'react';
import { resetScrollPosition, type ScrollToTopOptions } from '../utils/scrollToTop';

export function useScrollToTop(deps: DependencyList, options?: ScrollToTopOptions) {
  useEffect(() => {
    resetScrollPosition(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls trigger deps
  }, deps);
}
