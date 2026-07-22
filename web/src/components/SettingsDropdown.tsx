import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountLinkingSection } from './AccountLinkingSection';
import { getRoleLabel } from '../constants/roles';
import { useAuth } from '../contexts/AuthContext';
import { getCommunityDisplayName } from '../services/profileService';
import { useTheme } from '../contexts/ThemeContext';

type SettingsDropdownProps = {
  onLoginClick: () => void;
};

export function SettingsDropdown({ onLoginClick }: SettingsDropdownProps) {
  const { user, profile, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayName = getCommunityDisplayName(profile, user?.email);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  return (
    <div className="settings-dropdown" ref={rootRef}>
      <button
        type="button"
        className={`header-btn header-btn--settings${open ? ' header-btn--settings-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        ⚙️ 설정
      </button>

      {open ? (
        <div className="settings-dropdown-menu" role="menu">
          <div className="settings-dropdown-section">
            {!loading && user ? (
              <>
                <div className="settings-profile-card">
                  <p className="settings-profile-name">{displayName}</p>
                  <p className="settings-profile-email">{user.email}</p>
                  <span className="settings-role-badge">{getRoleLabel(profile?.role)}</span>
                </div>
                <button
                  type="button"
                  className="settings-dropdown-item"
                  onClick={() => {
                    void signOut();
                    setOpen(false);
                  }}
                >
                  🚪 로그아웃
                </button>
                <div className="settings-dropdown-divider" />
                <AccountLinkingSection />
              </>
            ) : (
              <button
                type="button"
                className="settings-dropdown-item settings-dropdown-item--primary"
                onClick={() => {
                  onLoginClick();
                  setOpen(false);
                }}
              >
                🔑 로그인 / 회원가입
              </button>
            )}
          </div>

          <div className="settings-dropdown-divider" />

          <div className="settings-dropdown-section">
            <p className="settings-dropdown-label">테마</p>
            <div className="settings-theme-toggle">
              <button
                type="button"
                className={`settings-theme-btn${theme === 'light' ? ' settings-theme-btn--active' : ''}`}
                onClick={() => setTheme('light')}
              >
                ☀️ 라이트
              </button>
              <button
                type="button"
                className={`settings-theme-btn${theme === 'dark' ? ' settings-theme-btn--active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                🌙 다크
              </button>
            </div>
          </div>

          <div className="settings-dropdown-divider" />

          <div className="settings-dropdown-section">
            <p className="settings-dropdown-label">약관 및 정책</p>
            <Link to="/legal/privacy" className="settings-dropdown-link" onClick={() => setOpen(false)}>
              📜 개인정보 처리방침
            </Link>
            <Link to="/legal/terms" className="settings-dropdown-link" onClick={() => setOpen(false)}>
              📋 이용약관
            </Link>
            <Link to="/legal/service" className="settings-dropdown-link" onClick={() => setOpen(false)}>
              ℹ️ KEMIX 서비스 정보 (v1.0)
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
