import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resetScrollPosition } from '../utils/scrollToTop';

/** 라우트(path) 변경 시 메인 창·스크롤 컨테이너를 최상단으로 이동 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    resetScrollPosition({ behavior: 'instant' });
  }, [pathname, search, hash]);

  return null;
}
