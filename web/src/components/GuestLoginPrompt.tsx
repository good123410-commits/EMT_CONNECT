import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOAuthLinkErrorMessage } from '../services/authService';
import type { AuthIntent } from '../utils/authIntent';

type GuestLoginPromptProps = {
  open?: boolean;
  onClose?: () => void;
  title: string;
  description: string;
  presentation?: 'sheet' | 'inline';
  variant?: 'default' | 'guide-gate';
  returnPath?: string;
  intent?: AuthIntent;
  kakaoLabel?: string;
  googleLabel?: string;
  dismissLabel?: string;
};

export function GuestLoginPrompt({
  open = true,
  onClose,
  title,
  description,
  presentation = 'sheet',
  variant = 'default',
  returnPath,
  intent,
  kakaoLabel = '카카오 3초 로그인',
  googleLabel = 'Google 로그인',
  dismissLabel = '나중에 하기',
}: GuestLoginPromptProps) {
  const { signInWithOAuth } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<'kakao' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (presentation === 'sheet' && !open) return null;

  const handleOAuth = async (provider: 'kakao' | 'google') => {
    setError(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider, { returnPath, intent });
    } catch (err) {
      setError(getOAuthLinkErrorMessage(err));
      setOauthLoading(null);
    }
  };

  const busy = oauthLoading !== null;

  const body = (
    <div
      className={`guest-login-prompt${presentation === 'inline' ? ' guest-login-prompt--inline' : ''}${variant === 'guide-gate' ? ' guest-login-prompt--guide-gate' : ''}`}
    >
      <h3 id="guest-login-title" className="guest-login-prompt-title">
        {title}
      </h3>
      <p className="guest-login-prompt-desc">{description}</p>

      <div className="social-login guest-login-prompt-actions">
        <p className="social-login-label">소셜 계정으로 간편 로그인</p>
        <button
          type="button"
          className="social-login-btn social-login-btn--kakao"
          disabled={busy}
          onClick={() => void handleOAuth('kakao')}
        >
          {oauthLoading === 'kakao' ? '연결 중…' : kakaoLabel}
        </button>
        <button
          type="button"
          className="social-login-btn social-login-btn--google"
          disabled={busy}
          onClick={() => void handleOAuth('google')}
        >
          {oauthLoading === 'google' ? '연결 중…' : googleLabel}
        </button>
      </div>

      {presentation === 'sheet' && onClose ? (
        <button type="button" className="guest-login-prompt-dismiss" onClick={onClose} disabled={busy}>
          {dismissLabel}
        </button>
      ) : null}

      {error ? (
        <p className="guest-login-prompt-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );

  if (presentation === 'inline') {
    return body;
  }

  return (
    <div className="guest-login-overlay" role="presentation" onClick={onClose}>
      <div
        className="guest-login-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-login-title"
        onClick={(event) => event.stopPropagation()}
      >
        {body}
      </div>
    </div>
  );
}
