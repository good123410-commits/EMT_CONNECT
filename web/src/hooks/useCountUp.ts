import { useEffect, useState } from 'react';

/** 숫자 카운트업 애니메이션 (react-countup 대체) */
export function useCountUp(target: number, options?: { duration?: number; enabled?: boolean }) {
  const duration = options?.duration ?? 1200;
  const enabled = options?.enabled ?? true;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, enabled]);

  return value;
}
