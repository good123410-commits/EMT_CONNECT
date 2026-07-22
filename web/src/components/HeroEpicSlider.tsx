import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { OpeningSlide } from '../types';

type HeroEpicSliderProps = {
  slides: OpeningSlide[];
  autoPlayMs?: number;
  children: ReactNode;
};

export function HeroEpicSlider({ slides, autoPlayMs = 5500, children }: HeroEpicSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragRef = useRef({ startX: 0, dragging: false });
  const count = slides.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, autoPlayMs);
    return () => window.clearInterval(timer);
  }, [count, paused, autoPlayMs]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, dragging: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const delta = e.clientX - dragRef.current.startX;
    dragRef.current.dragging = false;
    if (Math.abs(delta) > 48) {
      if (delta < 0) goNext();
      else goPrev();
    }
  };

  if (count === 0) {
    return (
      <section className="hero-epic hero-epic--empty">
        <div className="hero-epic-bg hero-epic-bg--fallback" />
        <div className="hero-epic-overlay" />
        <div className="hero-epic-content">{children}</div>
      </section>
    );
  }

  return (
    <section
      className="hero-epic hero-epic--slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragRef.current.dragging = false;
      }}
      aria-roledescription="carousel"
      aria-label="KEMIX 메인 히어로 슬라이드"
    >
      <div className="hero-epic-slides" aria-live="polite">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`hero-epic-slide${i === index ? ' hero-epic-slide--active' : ''}`}
            style={{ backgroundImage: `url("${slide.image_url}")` }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}: ${slide.title}`}
            aria-hidden={i !== index}
          />
        ))}
      </div>

      <div className="hero-epic-overlay" />

      <div className="hero-epic-content">{children}</div>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="hero-epic-nav hero-epic-nav--prev"
            onClick={goPrev}
            aria-label="이전 슬라이드"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-epic-nav hero-epic-nav--next"
            onClick={goNext}
            aria-label="다음 슬라이드"
          >
            ›
          </button>
          <div className="hero-epic-dots" role="tablist" aria-label="슬라이드 선택">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                className={`hero-epic-dot${i === index ? ' hero-epic-dot--active' : ''}`}
                aria-selected={i === index}
                aria-label={`${slide.title} (${i + 1}/${count})`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
