import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_THRESHOLD_PX = 32;

export function useHeaderOverlay() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return undefined;
    }

    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  return { isHome, scrolled };
}
