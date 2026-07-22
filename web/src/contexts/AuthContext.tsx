import type { Provider } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { fetchProfile, isApprovedAdmin } from '../services/profileService';
import type { UserProfile } from '../types';
import type { Session, User } from '@supabase/supabase-js';

const AUTH_RETURN_KEY = 'kemix-auth-return-to';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getOAuthRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${base}/auth/callback`;
}

export function storeAuthReturnPath(path?: string) {
  if (typeof window === 'undefined') return;
  const target = path ?? `${window.location.pathname}${window.location.search}`;
  sessionStorage.setItem(AUTH_RETURN_KEY, target || '/');
}

export function consumeAuthReturnPath(): string {
  if (typeof window === 'undefined') return '/';
  const path = sessionStorage.getItem(AUTH_RETURN_KEY) || '/';
  sessionStorage.removeItem(AUTH_RETURN_KEY);
  return path.startsWith('/') ? path : '/';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await fetchProfile(userId);
      if (p?.is_blocked) {
        await supabase.auth.signOut();
        setProfile(null);
        throw new Error('차단된 계정입니다. 관리자에게 문의해 주세요.');
      }
      setProfile(p);
    } catch (err) {
      if (err instanceof Error && err.message.includes('차단')) throw err;
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return;
    await loadProfile(session.user.id);
  }, [session?.user.id, loadProfile]);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        void loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(async (provider: Provider) => {
    storeAuthReturnPath();

    // 카카오 개인 앱: scopes 미지정 — account_email 요청 시 KOE205 발생
    const options: { redirectTo?: string; scopes?: string } = {
      redirectTo: getOAuthRedirectUrl(),
    };

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const isAdmin = isApprovedAdmin(profile);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      loading,
      signIn,
      signInWithOAuth,
      signOut,
      refreshProfile,
    }),
    [session, profile, isAdmin, loading, signIn, signInWithOAuth, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
