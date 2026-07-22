import { AppCtaBanner } from '../../components/AppCtaBanner';
import { PageHero } from '../../components/PageHero';

export function FacilitiesHospitalsPage() {
  return (
    <div className="container page-content">
      <PageHero
        eyebrow="실시간 응급의료 찾기"
        title="병·의원 찾기"
        subtitle="시·군·구별 검색, 진료과목·거리순 정렬"
        dark
      />
      <div className="prose-block">
        <p>
          KEMIX 앱 지도에서 전국 병·의원을 검색하고, 진료과목·진료시간·거리순으로 정렬해 가장
          가까운 의료기관을 찾을 수 있습니다.
        </p>
      </div>
      <AppCtaBanner />
    </div>
  );
}
