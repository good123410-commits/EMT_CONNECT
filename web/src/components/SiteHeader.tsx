import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BRAND_NAME, BRAND_NAME_KO } from '../constants/branding';
import { MAIN_NAV } from '../constants/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';
import { SettingsDropdown } from './SettingsDropdown';

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL ?? '#';

function ChevronIcon() {
  return (
    <svg className="gnb-chevron" viewBox="0 0 12 12" width="8" height="8" aria-hidden>
      <path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type SiteHeaderProps = {
  onLoginClick?: () => void;
};

export function SiteHeader({ onLoginClick }: SiteHeaderProps) {
  const { isAdmin } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const handleLoginOpen = () => {
    setLoginOpen(true);
    onLoginClick?.();
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const renderNavItems = (mobile = false) =>
    MAIN_NAV.map((item) =>
      'children' in item ? (
        <li
          key={item.label}
          className={`gnb-item gnb-item--dropdown${openDropdown === item.label ? ' gnb-item--open' : ''}`}
          onMouseEnter={mobile ? undefined : () => setOpenDropdown(item.label)}
          onMouseLeave={mobile ? undefined : () => setOpenDropdown(null)}
        >
          <button
            type="button"
            className="gnb-link gnb-link--trigger"
            aria-expanded={openDropdown === item.label}
            onClick={() => setOpenDropdown((v) => (v === item.label ? null : item.label))}
          >
            <span>{item.label}</span>
            <ChevronIcon />
          </button>
          <ul className="gnb-dropdown">
            {item.children.map((child) => (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  className="gnb-dropdown-link"
                  onClick={closeMobile}
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </li>
      ) : (
        <li key={item.label} className="gnb-item">
          <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) => `gnb-link${isActive ? ' gnb-link--active' : ''}`}
            onClick={closeMobile}
          >
            {item.label}
          </NavLink>
        </li>
      ),
    );

  return (
    <>
      <header className="site-header site-header--v2" ref={headerRef}>
        <div className="header-shell">
          {/* Left — Logo */}
          <Link to="/" className="header-brand" onClick={closeMobile}>
            <span className="brand-mark">{BRAND_NAME}</span>
            <span className="brand-sub">{BRAND_NAME_KO}</span>
          </Link>

          {/* Center — GNB */}
          <nav className="header-nav" aria-label="주요 메뉴">
            <ul className="gnb-list">{renderNavItems()}</ul>
          </nav>

          {/* Right — Actions */}
          <div className="header-actions">
            {isAdmin && (
              <Link to="/admin" className="header-btn header-btn--admin" onClick={closeMobile}>
                관리자
              </Link>
            )}
            <a
              href={APP_STORE_URL}
              className="header-btn header-btn--download"
              target="_blank"
              rel="noreferrer"
            >
              앱 다운로드
            </a>
            <SettingsDropdown onLoginClick={handleLoginOpen} />

            <button
              type="button"
              className={`header-hamburger${mobileOpen ? ' header-hamburger--open' : ''}`}
              aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className={`header-mobile${mobileOpen ? ' header-mobile--open' : ''}`} aria-hidden={!mobileOpen}>
          <nav className="header-mobile-nav" aria-label="모바일 메뉴">
            <ul className="gnb-list gnb-list--mobile">{renderNavItems(true)}</ul>
          </nav>
          <div className="header-mobile-actions">
            {isAdmin && (
              <Link to="/admin" className="header-btn header-btn--admin header-btn--block" onClick={closeMobile}>
                관리자 페이지
              </Link>
            )}
            <div className="header-mobile-settings">
              <SettingsDropdown
                onLoginClick={() => {
                  handleLoginOpen();
                  closeMobile();
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
