import { Link, NavLink, Outlet } from 'react-router-dom';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL ?? '/admin';

const NAV_ITEMS = [
  { to: '/', label: '홈', end: true },
  { to: '/blog', label: '생활 응급처치 가이드' },
  { to: '/facilities', label: '응급실/병·의원 찾기' },
  { to: ADMIN_URL, label: '관리자', external: ADMIN_URL.startsWith('http') },
] as const;

export function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">KEMI</span>
            <span className="brand-sub">Korea Emergency Medical Innovators</span>
          </Link>
          <nav className="nav" aria-label="주요 메뉴">
            {NAV_ITEMS.map((item) =>
              item.external ? (
                <a key={item.label} href={item.to} className="nav-link" target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>
        </div>
      </header>
      <main className="site-main container">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <p>© {new Date().getFullYear()} KEMI. 응급의료 혁신을 위한 공식 플랫폼.</p>
          <div className="footer-links">
            <Link to="/blog">가이드</Link>
            <Link to="/facilities">병원 찾기</Link>
            <Link to="/admin">관리자</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
