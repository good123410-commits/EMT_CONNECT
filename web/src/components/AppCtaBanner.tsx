const APP_DEEP_LINK = import.meta.env.VITE_APP_DEEP_LINK ?? 'emtconnect://map';
const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL ?? '#';

export function AppCtaBanner() {
  return (
    <section className="app-cta">
      <div className="app-cta-inner">
        <div className="app-cta-copy">
          <p className="app-cta-eyebrow">KEMI Mobile App</p>
          <h2>언제 어디서나, KEMI 모바일 앱으로 더 빠르게 응급실 정보를 확인하세요</h2>
          <p className="app-cta-desc">
            실시간 병상·장비·당직 연락처, 지도 기반 병·의원 찾기, EMS 커뮤니티까지 한 번에.
          </p>
        </div>
        <div className="app-cta-actions">
          <a href={APP_DEEP_LINK} className="btn btn-cta-primary">
            앱에서 열기
          </a>
          <a href={APP_STORE_URL} className="btn btn-cta-ghost">
            홈 화면에 추가
          </a>
        </div>
      </div>
    </section>
  );
}
