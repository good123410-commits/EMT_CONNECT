import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { BRAND_FULL_NAME, BRAND_NAME, BRAND_NAME_KO } from '../constants/branding';
import { useAuth } from '../contexts/AuthContext';
import { findEmailHintByNickname } from '../services/profileService';
import { getOAuthLinkErrorMessage } from '../services/authService';
import type { ProfileJobRole } from '../types';

export type AuthModalView = 'login' | 'signup' | 'reset' | 'find-email';

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  initialView?: AuthModalView;
};

const JOB_ROLE_OPTIONS: { value: ProfileJobRole; label: string }[] = [
  { value: 'paramedic', label: '구급대원' },
  { value: 'hospital', label: '응급의학과 의료진' },
  { value: 'user', label: '일반 회원' },
];

function validatePassword(password: string): string | null {
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  return null;
}

export function LoginModal({ open, onClose, initialView = 'login' }: LoginModalProps) {
  const { signIn, signUp, signInWithOAuth, resetPasswordForEmail } = useAuth();
  const titleId = useId();
  const descId = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<AuthModalView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'kakao' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
    setError(null);
    setSuccess(null);
    setEmailHint(null);
  };

  const resetModalState = () => {
    setLoading(false);
    setOauthLoading(null);
    setError(null);
    setSuccess(null);
    setEmailHint(null);
  };

  const handleClose = () => {
    resetModalState();
    resetFormState();
    setView('login');
    onClose();
  };

  const switchView = (next: AuthModalView) => {
    resetModalState();
    setError(null);
    setSuccess(null);
    setEmailHint(null);
    if (next === 'login' || next === 'signup') {
      setPassword('');
      setConfirmPassword('');
    }
    setView(next);
  };

  useEffect(() => {
    if (!open) {
      resetModalState();
      return;
    }

    setView(initialView);
    resetModalState();
    const timer = window.setTimeout(() => emailRef.current?.focus(), 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      resetModalState();
    };
  }, [open, initialView]);

  if (!open) return null;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      resetFormState();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password || !confirmPassword) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp(email.trim(), password);
      if (needsEmailConfirmation) {
        setSuccess('가입 확인 메일을 발송했습니다. 메일함을 확인한 뒤 로그인해 주세요.');
        setPassword('');
        setConfirmPassword('');
      } else {
        resetFormState();
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('가입 시 사용한 이메일을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordForEmail(email.trim());
      setSuccess('비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해 주세요.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '재설정 메일 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailHint(null);

    if (!nickname.trim()) {
      setError('가입 시 설정한 별명을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const hint = await findEmailHintByNickname(nickname.trim());
      if (!hint) {
        setError('일치하는 별명을 찾을 수 없습니다. 별명을 확인하거나 고객센터로 문의해 주세요.');
      } else {
        setEmailHint(hint);
        setSuccess('가입 이메일 힌트를 찾았습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 조회에 실패했습니다.');
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
      setError(getOAuthLinkErrorMessage(err));
    } finally {
      setOauthLoading(null);
    }
  };

  const busy = loading || oauthLoading !== null;

  const titles: Record<AuthModalView, string> = {
    login: '로그인',
    signup: '자체 회원가입',
    reset: '비밀번호 재설정',
    'find-email': '아이디(이메일) 찾기',
  };

  const descriptions: Record<AuthModalView, string> = {
    login: `${BRAND_NAME} 계정으로 로그인하세요.`,
    signup: '이메일과 비밀번호로 KEMIX 계정을 만듭니다.',
    reset: '가입 시 사용한 이메일로 재설정 링크를 보내 드립니다.',
    'find-email': '가입 시 설정한 별명으로 이메일 힌트를 조회합니다.',
  };

  return (
    <div className="modal-overlay" onClick={handleClose} role="presentation">
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={handleClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="modal-brand">
          <span className="modal-brand-mark">{BRAND_NAME}</span>
          <span className="modal-brand-ko">{BRAND_NAME_KO}</span>
        </div>

        <h2 id={titleId} className="modal-title">
          {titles[view]}
        </h2>
        <p id={descId} className="modal-desc">
          {descriptions[view]}
          {view === 'login' ? (
            <>
              <br />
              <span className="modal-desc-sub">{BRAND_FULL_NAME}</span>
            </>
          ) : null}
        </p>

        {view === 'login' ? (
          <>
            <div className="social-login">
              <p className="social-login-label">소셜 계정으로 간편 로그인</p>
              <button
                type="button"
                className="social-login-btn social-login-btn--kakao"
                disabled={busy}
                onClick={() => void handleOAuth('kakao')}
              >
                {oauthLoading === 'kakao' ? '연결 중…' : '🟡 카카오로 시작하기'}
              </button>
              <button
                type="button"
                className="social-login-btn social-login-btn--google"
                disabled={busy}
                onClick={() => void handleOAuth('google')}
              >
                {oauthLoading === 'google' ? '연결 중…' : '⚪ Google 계정으로 로그인'}
              </button>
            </div>

            <div className="modal-divider">
              <span>또는 이메일로 로그인</span>
            </div>

            <form className="modal-form" onSubmit={handleLogin} noValidate>
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
                disabled={busy}
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
                disabled={busy}
                required
              />

              {error ? (
                <p className="modal-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn btn-primary modal-submit" disabled={busy}>
                {loading ? '로그인 중…' : '로그인'}
              </button>
            </form>

            <nav className="auth-modal-links" aria-label="계정 관련 링크">
              <button type="button" className="auth-modal-link" onClick={() => switchView('find-email')}>
                아이디(이메일) 찾기
              </button>
              <span className="auth-modal-link-sep" aria-hidden>
                |
              </span>
              <button type="button" className="auth-modal-link" onClick={() => switchView('reset')}>
                비밀번호 재설정
              </button>
              <span className="auth-modal-link-sep" aria-hidden>
                |
              </span>
              <button type="button" className="auth-modal-link" onClick={() => switchView('signup')}>
                자체 회원가입
              </button>
            </nav>
          </>
        ) : null}

        {view === 'signup' ? (
          <form className="modal-form" onSubmit={handleSignUp} noValidate>
            <label className="modal-label" htmlFor="signup-email">
              이메일
            </label>
            <input
              ref={emailRef}
              id="signup-email"
              className="modal-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
            />

            <label className="modal-label" htmlFor="signup-password">
              비밀번호
            </label>
            <input
              id="signup-password"
              className="modal-input"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              required
            />

            <label className="modal-label" htmlFor="signup-confirm">
              비밀번호 확인
            </label>
            <input
              id="signup-confirm"
              className="modal-input"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={busy}
              required
            />

            <p className="modal-hint">가입 후 프로필 설정에서 커뮤니티용 별명을 등록합니다.</p>

            {error ? (
              <p className="modal-error" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="modal-success" role="status">
                {success}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary modal-submit" disabled={busy}>
              {loading ? '가입 중…' : '회원가입'}
            </button>

            <button type="button" className="auth-modal-back" onClick={() => switchView('login')}>
              ← 로그인으로 돌아가기
            </button>
          </form>
        ) : null}

        {view === 'reset' ? (
          <form className="modal-form" onSubmit={handleResetPassword} noValidate>
            <label className="modal-label" htmlFor="reset-email">
              이메일
            </label>
            <input
              ref={emailRef}
              id="reset-email"
              className="modal-input"
              type="email"
              autoComplete="email"
              placeholder="가입 시 사용한 이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
            />

            {error ? (
              <p className="modal-error" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="modal-success" role="status">
                {success}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary modal-submit" disabled={busy}>
              {loading ? '발송 중…' : '재설정 링크 보내기'}
            </button>

            <button type="button" className="auth-modal-back" onClick={() => switchView('login')}>
              ← 로그인으로 돌아가기
            </button>
          </form>
        ) : null}

        {view === 'find-email' ? (
          <form className="modal-form" onSubmit={handleFindEmail} noValidate>
            <label className="modal-label" htmlFor="find-nickname">
              별명
            </label>
            <input
              ref={emailRef}
              id="find-nickname"
              className="modal-input"
              type="text"
              autoComplete="nickname"
              placeholder="가입 시 설정한 별명"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={busy}
              required
            />

            <p className="modal-hint">프로필 설정에서 등록한 별명으로 가입 이메일 일부를 확인할 수 있습니다.</p>

            {error ? (
              <p className="modal-error" role="alert">
                {error}
              </p>
            ) : null}
            {success && emailHint ? (
              <p className="modal-success" role="status">
                {success} <strong>{emailHint}</strong>
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary modal-submit" disabled={busy}>
              {loading ? '조회 중…' : '이메일 찾기'}
            </button>

            <button type="button" className="auth-modal-back" onClick={() => switchView('login')}>
              ← 로그인으로 돌아가기
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export { JOB_ROLE_OPTIONS };
