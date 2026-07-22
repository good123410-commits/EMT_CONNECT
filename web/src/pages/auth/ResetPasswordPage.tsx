import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function validatePassword(password: string): string | null {
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  return null;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          throw new Error('재설정 링크가 만료되었거나 유효하지 않습니다. 비밀번호 재설정을 다시 요청해 주세요.');
        }

        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setSessionError(err instanceof Error ? err.message : '세션을 확인할 수 없습니다.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      window.setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page-card">
        <h1 className="auth-page-title">새 비밀번호 설정</h1>

        {sessionError ? (
          <>
            <p className="modal-error" role="alert">
              {sessionError}
            </p>
            <Link to="/" className="auth-modal-back">
              홈으로 돌아가기
            </Link>
          </>
        ) : null}

        {!sessionError && !ready ? <p className="auth-page-desc">링크 확인 중…</p> : null}

        {!sessionError && ready && !done ? (
          <form className="modal-form" onSubmit={handleSubmit} noValidate>
            <label className="modal-label" htmlFor="new-password">
              새 비밀번호
            </label>
            <input
              id="new-password"
              className="modal-input"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <label className="modal-label" htmlFor="new-password-confirm">
              새 비밀번호 확인
            </label>
            <input
              id="new-password-confirm"
              className="modal-input"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              required
            />

            {error ? (
              <p className="modal-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary modal-submit" disabled={loading}>
              {loading ? '변경 중…' : '비밀번호 변경'}
            </button>
          </form>
        ) : null}

        {done ? (
          <p className="modal-success" role="status">
            비밀번호가 변경되었습니다. 잠시 후 홈으로 이동합니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
