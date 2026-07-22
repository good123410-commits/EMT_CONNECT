import { AppCtaBanner } from '../../components/AppCtaBanner';
import { PageHero } from '../../components/PageHero';

export function FacilitiesErPage() {
  return (
    <div className="container page-content">
      <PageHero
        eyebrow="실시간 응급의료 찾기"
        title="응급실 가동 현황"
        subtitle="전국 응급실 실시간 병상·장비·당직 연락처"
        dark
      />
      <div className="prose-block">
        <p>
          KEMIX 앱에서는 공공 API와 자체 데이터를 결합해 응급실 병상 현황, CT/MRI/인공호흡기
          가용 여부, 응급실·소아 당직의 직통 연락처를 실시간으로 확인할 수 있습니다.
        </p>
      </div>
      <div className="facilities-grid">
        <article className="facilities-card">
          <h2>🚨 실시간 병상</h2>
          <p>일반·소아·분만·음압 격리 병상 가용 현황</p>
        </article>
        <article className="facilities-card">
          <h2>🔬 장비 현황</h2>
          <p>CT, MRI, 조영술, 인공호흡기, 인공신장 가용 여부</p>
        </article>
        <article className="facilities-card">
          <h2>📞 당직 연락처</h2>
          <p>응급실·소아 당직의 직통 전화번호</p>
        </article>
      </div>
      <AppCtaBanner />
    </div>
  );
}
