import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppCtaBanner } from '../components/AppCtaBanner';
import { HeroEpicSlider } from '../components/HeroEpicSlider';
import { HomeGuideSection } from '../components/HomeGuideSection';
import { MonthlyInterviewSection } from '../components/MonthlyInterviewSection';
import { OpeningMontage } from '../components/OpeningMontage';
import { PlatformStatsBar } from '../components/PlatformStatsBar';
import { useOpeningSlides } from '../hooks/useOpeningSlides';
import { BRAND_FULL_NAME, BRAND_NAME, BRAND_NAME_KO } from '../constants/branding';

export function LandingPage() {
  const [introDone, setIntroDone] = useState(() => !!sessionStorage.getItem('kemix-intro-seen'));
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);
  const { slides, loading: slidesLoading } = useOpeningSlides();

  return (
    <>
      {!introDone && <OpeningMontage onComplete={handleIntroComplete} />}

      <div className="landing">
        <HeroEpicSlider slides={slidesLoading ? [] : slides}>
          <p className="hero-epic-eyebrow">{BRAND_FULL_NAME}</p>
          <h1 className="hero-epic-title">
            대한민국 응급의료의
            <br />
            <span>차세대 혁신</span>을 이끌다
          </h1>
          <p className="hero-epic-lead">
            {BRAND_NAME}({BRAND_NAME_KO})는 응급실 정보, 생활 응급처치 가이드, 구급대원 커뮤니티를
            하나로 연결하는 공식 플랫폼입니다.
          </p>
          <div className="hero-epic-actions">
            <Link to="/community/board" className="btn btn-hero-primary">
              KEMIX 커뮤니티
            </Link>
            <Link to="/blog" className="btn btn-hero-ghost">
              생활 응급처치 가이드
            </Link>
          </div>
        </HeroEpicSlider>

        <PlatformStatsBar />
        <MonthlyInterviewSection />
        <AppCtaBanner />
        <HomeGuideSection />
      </div>
    </>
  );
}
