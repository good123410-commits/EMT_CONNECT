import { Link } from 'react-router-dom';
import { AdSenseSlot } from '../components/AdSenseSlot';
import { AppCtaBanner } from '../components/AppCtaBanner';
import { FeatureCards } from '../components/FeatureCards';
import { HomeGuideSection } from '../components/HomeGuideSection';
import { PlatformStatsBar } from '../components/PlatformStatsBar';

export function LandingPage() {
  return (
    <div className="landing">
      <section className="hero hero--dense">
        <p className="eyebrow">Korea Emergency Medical Innovators</p>
        <h1>응급의료, 일상 속에서 더 가깝게</h1>
        <p className="lead">
          KEMI는 응급실 정보, 생활 응급처치 가이드, 구급대원 커뮤니티를 하나로 연결하는
          공식 플랫폼입니다.
        </p>
        <div className="hero-actions">
          <Link to="/blog" className="btn btn-primary">
            생활 응급처치 가이드
          </Link>
          <Link to="/facilities" className="btn btn-secondary">
            응급실·병원 찾기
          </Link>
        </div>
      </section>

      <PlatformStatsBar />

      <AdSenseSlot slotId="landing-mid" className="my-8" />

      <FeatureCards />

      <AppCtaBanner />

      <HomeGuideSection />
    </div>
  );
}
