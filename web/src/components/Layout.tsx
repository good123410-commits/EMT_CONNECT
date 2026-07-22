import { Outlet, Link } from 'react-router-dom';
import { BRAND_NAME, BRAND_NAME_KO } from '../constants/branding';
import { SiteHeader } from './SiteHeader';

export function Layout() {
  return (
    <div className="site site--v2">
      <SiteHeader />
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer site-footer--v2">
        <div className="container footer-grid">
          <div className="footer-brand">
            <p className="footer-mark">{BRAND_NAME}</p>
            <p className="footer-sub">{BRAND_NAME_KO} · Korea EMT Medical Innovation eXchange / NeXt</p>
            <p className="footer-copy">
              © {new Date().getFullYear()} {BRAND_NAME}. 응급의료 혁신을 위한 공식 플랫폼.
            </p>
          </div>
          <div className="footer-col">
            <h4>소개</h4>
            <Link to="/about/vision">케믹스 비전</Link>
            <Link to="/about/history">케믹스 연혁</Link>
            <Link to="/content/interview">KEMIX 콘텐츠</Link>
          </div>
          <div className="footer-col">
            <h4>서비스</h4>
            <Link to="/blog">응급처치 가이드</Link>
            <Link to="/community/board">자유게시판</Link>
            {/* <Link to="/community/skills">스킬 테크 트리</Link> */}
            <Link to="/community/polls">KEMIX 투표</Link>
            <Link to="/community/donation">모금 계좌</Link>
          </div>
          <div className="footer-col">
            <h4>지원</h4>
            <Link to="/download/app">앱 다운로드</Link>
            <Link to="/download/faq">자주 묻는 질문</Link>
            <Link to="/download/contact">1:1 문의</Link>
          </div>
          <div className="footer-col">
            <h4>약관 · 정책</h4>
            <Link to="/legal/privacy">개인정보 처리방침</Link>
            <Link to="/legal/terms">이용약관</Link>
            <Link to="/legal/service">KEMIX 서비스 정보</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
