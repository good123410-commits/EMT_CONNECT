import { useCallback, useEffect, useRef, useState } from 'react';
import { BRAND_FULL_NAME } from '../constants/branding';
import { OPENING_SLIDES } from '../constants/openingSlides';
import { fetchOpeningSlides, preloadSlideImages } from '../services/openingSlideService';
import type { OpeningSlide } from '../types';

const INTRO_KEY = 'kemix-intro-seen';
const SLIDE_MS = 1400;
const REVEAL_MS = 1000;
const HOLD_MS = 2400;
const EXIT_MS = 900;

type Phase = 'loading' | 'montage' | 'reveal' | 'hold' | 'exit' | 'finished';

type OpeningMontageProps = {
  onComplete: () => void;
};

function getActiveSlides(slides: OpeningSlide[]) {
  return slides.length > 0
    ? slides
    : OPENING_SLIDES.filter((slide) => slide.is_active).sort(
        (a, b) => a.display_order - b.display_order,
      );
}

export function OpeningMontage({ onComplete }: OpeningMontageProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const seenOnMount = useRef(!!sessionStorage.getItem(INTRO_KEY));
  const finishedRef = useRef(seenOnMount.current);
  const timelineStartedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const [phase, setPhase] = useState<Phase>(seenOnMount.current ? 'finished' : 'loading');
  const [slides, setSlides] = useState<OpeningSlide[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
      window.clearInterval(id);
    }
    timersRef.current = [];
  }, []);

  const finishIntro = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    sessionStorage.setItem(INTRO_KEY, '1');
    document.body.style.overflow = '';
    setPhase('finished');
    onCompleteRef.current();
  }, [clearTimers]);

  const skipIntro = useCallback(() => {
    if (finishedRef.current) return;
    clearTimers();
    setPhase('exit');
    const exitTimer = window.setTimeout(() => {
      finishIntro();
    }, Math.min(EXIT_MS, 400));
    timersRef.current.push(exitTimer);
  }, [clearTimers, finishIntro]);

  useEffect(() => {
    if (seenOnMount.current) {
      onCompleteRef.current();
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchOpeningSlides();
        if (cancelled) return;
        const activeSlides = getActiveSlides(rows);
        setSlides(activeSlides);
        void preloadSlideImages(activeSlides);
        setPhase('montage');
      } catch {
        if (cancelled) return;
        const activeSlides = getActiveSlides([]);
        setSlides(activeSlides);
        setPhase('montage');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (seenOnMount.current || slides.length === 0 || timelineStartedRef.current) return undefined;

    timelineStartedRef.current = true;
    document.body.style.overflow = 'hidden';

    const montageMs = SLIDE_MS * slides.length;
    const totalMs = montageMs + REVEAL_MS + HOLD_MS + EXIT_MS;

    const slideTimer = window.setInterval(() => {
      setSlideIndex((index) => (index + 1) % slides.length);
    }, SLIDE_MS);

    const revealTimer = window.setTimeout(() => setPhase('reveal'), montageMs);
    const holdTimer = window.setTimeout(() => setPhase('hold'), montageMs + REVEAL_MS);
    const exitTimer = window.setTimeout(() => setPhase('exit'), montageMs + REVEAL_MS + HOLD_MS);
    const finishTimer = window.setTimeout(() => {
      finishIntro();
    }, totalMs);

    timersRef.current = [slideTimer, revealTimer, holdTimer, exitTimer, finishTimer];

    return () => {
      clearTimers();
      document.body.style.overflow = '';
      timelineStartedRef.current = false;
    };
  }, [slides, finishIntro, clearTimers]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        skipIntro();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [skipIntro]);

  if (phase === 'finished') return null;

  const showReveal = phase === 'reveal' || phase === 'hold' || phase === 'exit';
  const keepReveal = phase === 'hold' || phase === 'exit';
  const activeSlide = slides[slideIndex];

  return (
    <div
      className={`opening-montage opening-montage--${phase === 'loading' ? 'montage' : phase}`}
      role="presentation"
      aria-hidden="true"
      onClick={skipIntro}
    >
      <div className={`opening-slides${slides.length === 0 ? ' opening-slides--fallback' : ''}`}>
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`opening-slide${i === slideIndex ? ' opening-slide--active' : ''}${i === slideIndex ? ' opening-slide--kenburns' : ''}`}
            style={{ backgroundImage: `url("${slide.image_url}")` }}
          />
        ))}
      </div>

      {activeSlide?.caption && phase === 'montage' ? (
        <p className="opening-slide-caption">{activeSlide.caption}</p>
      ) : null}

      <div className="opening-overlay" />

      <div
        className={[
          'opening-reveal',
          showReveal ? 'opening-reveal--visible' : '',
          keepReveal ? 'opening-reveal--hold' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <p className="opening-reveal-en">KEMIX</p>
        <p className="opening-reveal-ko">케믹스</p>
        <p className="opening-reveal-tagline">대한민국 응급의료의 차세대 혁신을 이끌다</p>
        <p className="opening-reveal-sub">{BRAND_FULL_NAME}</p>
      </div>

      <button
        type="button"
        className="opening-skip"
        onClick={(event) => {
          event.stopPropagation();
          skipIntro();
        }}
      >
        건너뛰기
      </button>
    </div>
  );
}
