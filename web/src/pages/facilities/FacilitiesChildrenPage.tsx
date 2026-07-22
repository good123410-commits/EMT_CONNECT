import { AppCtaBanner } from '../../components/AppCtaBanner';
import { PageHero } from '../../components/PageHero';

export function FacilitiesChildrenPage() {
  return (
    <div className="container page-content">
      <PageHero
        eyebrow="실시간 응급의료 찾기"
        title="달빛어린이병원"
        subtitle="소아 응급 특화 병원을 빠르게 찾기"
        dark
      />
      <div className="prose-block">
        <p>
          달빛어린이병원 및 소아 응급 특화 의료기관을 별도 탭에서 빠르게 검색할 수 있습니다.
          KEMIX 앱에서 지도 기반으로 확인하세요.
        </p>
      </div>
      <AppCtaBanner />
    </div>
  );
}
