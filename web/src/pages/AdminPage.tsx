import { AppCtaBanner } from '../components/AppCtaBanner';

const ADMIN_APP_HINT =
  import.meta.env.VITE_ADMIN_URL ??
  '모바일 앱 → 설정 → 통합 관리자 대시보드에서 로그인 후 관리할 수 있습니다.';

export function AdminPage() {
  return (
    <div className="admin-page">
      <h1>관리자 포털</h1>
      <p className="lead">
        병원 데이터, 응급처치 가이드(블로그), 커뮤니티 콘텐츠는 KEMIX 통합 관리자 대시보드에서
        관리합니다.
      </p>

      <div className="admin-card">
        <h2>접속 방법</h2>
        <ol className="admin-steps">
          <li>KEMIX 모바일 앱을 실행합니다.</li>
          <li>설정 → 통합 관리자 대시보드로 이동합니다.</li>
          <li>승인된 관리자 계정으로 로그인합니다.</li>
        </ol>
        <p className="muted">{ADMIN_APP_HINT}</p>
      </div>

      <div className="admin-grid">
        <article className="admin-feature">
          <h3>병원 데이터 관리</h3>
          <p>제휴·숨김·응급 장비 오버라이드, 커스텀 메모</p>
        </article>
        <article className="admin-feature">
          <h3>응급 가이드(블로그)</h3>
          <p>웹·앱 실시간 동기화, SEO 메타 태그</p>
        </article>
        <article className="admin-feature">
          <h3>커뮤니티 관제</h3>
          <p>게시물 숨김, 채팅방, Q&A 관리</p>
        </article>
      </div>

      <AppCtaBanner />
    </div>
  );
}
