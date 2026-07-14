import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase, type UserProfile } from '@/lib/supabaseClient';
import { ensureProfile, fetchProfile } from '@/services/profileService';

const SESSION_INIT_TIMEOUT_MS = 3_000;
const PROFILE_LOAD_TIMEOUT_MS = 4_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getSessionSafe(): Promise<Session | null> {
  const sessionPromise = supabase.auth
    .getSession()
    .then(({ data }) => data.session)
    .catch(() => null);

  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), SESSION_INIT_TIMEOUT_MS);
  });

  return Promise.race([sessionPromise, timeoutPromise]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string, name?: string, email?: string) => {
    try {
      let p = await fetchProfile(userId);
      if (!p) p = await ensureProfile(userId, name, email);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return;
    await loadProfile(session.user.id, session.user.user_metadata?.name, session.user.email);
  }, [session?.user.id, session?.user.user_metadata?.name, session?.user.email, loadProfile]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const s = await getSessionSafe();
        if (!mounted) return;

        setSession(s);
        if (s?.user) {
          void withTimeout(
            loadProfile(s.user.id, s.user.user_metadata?.name, s.user.email),
            PROFILE_LOAD_TIMEOUT_MS,
            undefined,
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        void loadProfile(s.user.id, s.user.user_metadata?.name, s.user.email);
      } else {
        setProfile(null);
      }
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

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (data.user) await ensureProfile(data.user.id, name, email);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
