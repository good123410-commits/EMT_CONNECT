import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { BRAND_FULL_NAME, BRAND_NAME, BRAND_NAME_KO } from '../constants/branding';
import { useAuth } from '../contexts/AuthContext';

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn, signInWithOAuth } = useAuth();
  const titleId = useId();
  const descId = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'kakao' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setError(null);
    const timer = window.setTimeout(() => emailRef.current?.focus(), 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      setEmail('');
      setPassword('');
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해 주세요.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'kakao' | 'google') => {
    setError(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '소셜 로그인에 실패했습니다. 다시 시도해 주세요.';
      setError(message);
      setOauthLoading(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="modal-brand">
          <span className="modal-brand-mark">{BRAND_NAME}</span>
          <span className="modal-brand-ko">{BRAND_NAME_KO}</span>
        </div>

        <h2 id={titleId} className="modal-title">
          로그인
        </h2>
        <p id={descId} className="modal-desc">
          {BRAND_NAME} 모바일 앱과 동일한 계정으로 로그인하세요.
          <br />
          <span className="modal-desc-sub">{BRAND_FULL_NAME}</span>
        </p>

        <div className="social-login">
          <p className="social-login-label">소셜 계정으로 간편 로그인</p>
          <button
            type="button"
            className="social-login-btn social-login-btn--kakao"
            disabled={loading || oauthLoading !== null}
            onClick={() => void handleOAuth('kakao')}
          >
            {oauthLoading === 'kakao' ? '연결 중…' : '🟡 카카오로 시작하기'}
          </button>
          <button
            type="button"
            className="social-login-btn social-login-btn--google"
            disabled={loading || oauthLoading !== null}
            onClick={() => void handleOAuth('google')}
          >
            {oauthLoading === 'google' ? '연결 중…' : '⚪ Google 계정으로 로그인'}
          </button>
        </div>

        <div className="modal-divider">
          <span>또는 이메일로 로그인</span>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <label className="modal-label" htmlFor="login-email">
            이메일
          </label>
          <input
            ref={emailRef}
            id="login-email"
            className="modal-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <label className="modal-label" htmlFor="login-password">
            비밀번호
          </label>
          <input
            id="login-password"
            className="modal-input"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          {error ? (
            <p className="modal-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary modal-submit" disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <p className="modal-footer-note">
          계정이 없으신가요? {BRAND_NAME} 모바일 앱에서 회원가입할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
