import { useState } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { getOAuthLinkErrorMessage } from '../services/authService';
import { getCommunityDisplayName } from '../services/profileService';

const PROVIDER_ICONS: Record<string, string> = {
  email: '✉️',
  kakao: '🟡',
  google: '⚪',
};

export function AccountLinkingSection() {
  const { user, profile, linkedProviders, linkOAuthProvider } = useAuth();
  const [linking, setLinking] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const displayName = getCommunityDisplayName(profile, user.email);

  const handleLink = async (provider: Provider) => {
    setError(null);
    setLinking(provider);
    try {
      await linkOAuthProvider(provider);
    } catch (err) {
      setError(getOAuthLinkErrorMessage(err));
      setLinking(null);
    }
  };

  return (
    <div className="account-linking">
      <p className="settings-dropdown-label">계정 · 로그인 연동</p>
      <p className="account-linking-hint">
        동일 이메일로 가입한 계정은 소셜 로그인 시 프로필이 자동으로 이어집니다.
      </p>

      <div className="account-linking-list">
        {linkedProviders.map((item) => (
          <div key={item.id} className="account-linking-row">
            <div className="account-linking-row-main">
              <span className="account-linking-icon" aria-hidden>
                {PROVIDER_ICONS[item.id] ?? '🔑'}
              </span>
              <div>
                <p className="account-linking-name">{item.label}</p>
                <p className={`account-linking-status${item.connected ? ' account-linking-status--on' : ''}`}>
                  {item.connected ? '연결됨' : '미연결'}
                </p>
              </div>
            </div>

            {item.linkable && !item.connected ? (
              <button
                type="button"
                className="account-linking-btn"
                disabled={linking !== null}
                onClick={() => void handleLink(item.id as Provider)}
              >
                {linking === item.id ? '연결 중…' : '연동'}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {profile?.nickname ? (
        <p className="account-linking-nickname">
          커뮤니티 별명: <strong>{profile.nickname}</strong>
        </p>
      ) : (
        <p className="account-linking-nickname">표시 이름: {displayName}</p>
      )}

      {error ? (
        <p className="account-linking-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
