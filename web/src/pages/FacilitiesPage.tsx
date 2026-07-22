import { Link } from 'react-router-dom';
import { AppCtaBanner } from '../components/AppCtaBanner';

export function FacilitiesPage() {
  return (
    <div className="facilities-page">
      <h1>응급실 · 병·의원 찾기</h1>
      <p className="lead">
        전국 응급실 실시간 병상, CT/MRI 장비 가용 여부, 당직의 직통 연락처를 KEMI 앱 지도에서
        확인할 수 있습니다.
      </p>

      <div className="facilities-grid">
        <article className="facilities-card">
          <h2>🚨 응급실 탭</h2>
          <p>실시간 병상 현황, 장비 가용, 응급실·소아 당직 직통 전화를 한 화면에서 확인합니다.</p>
        </article>
        <article className="facilities-card">
          <h2>🏥 병·의원 찾기</h2>
          <p>시·군·구별 검색, 진료과목·진료시간, 거리순 정렬을 지원합니다.</p>
        </article>
        <article className="facilities-card">
          <h2>👶 달빛어린이병원</h2>
          <p>소아 응급 특화 병원을 별도 탭에서 빠르게 찾을 수 있습니다.</p>
        </article>
      </div>

      <AppCtaBanner />
    </div>
  );
}
