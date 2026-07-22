import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consumeAuthReturnPath } from '../contexts/AuthContext';
import { reconcileProfileAfterAuth } from '../services/authService';
import { supabase } from '../lib/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('로그인 처리 중…');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        await reconcileProfileAfterAuth();

        const returnTo = consumeAuthReturnPath();
        if (!cancelled) {
          navigate(returnTo, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : '로그인에 실패했습니다.');
          window.setTimeout(() => navigate('/', { replace: true }), 2500);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="auth-callback">
      <p>{message}</p>
    </div>
  );
}
