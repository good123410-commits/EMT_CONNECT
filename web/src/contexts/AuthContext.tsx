import type { Provider, Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ProfileSetupModal } from '../components/ProfileSetupModal';
import {
  getLinkedAuthProviders,
  linkOAuthProvider,
  reconcileProfileAfterAuth,
  type LinkedAuthProvider,
} from '../services/authService';
import {
  fetchProfile,
  isApprovedAdmin,
  isProfileComplete,
} from '../services/profileService';
import { supabase } from '../lib/supabase';
import {
  consumeAuthReturnPath,
  getOAuthRedirectUrl,
  getPasswordResetRedirectUrl,
  storeAuthReturnPath,
} from '../utils/authRedirects';
import type { UserProfile } from '../types';

export {
  consumeAuthReturnPath,
  getOAuthRedirectUrl,
  getPasswordResetRedirectUrl,
  storeAuthReturnPath,
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  needsProfileSetup: boolean;
  profileLoading: boolean;
  linkedProviders: LinkedAuthProvider[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithOAuth: (provider: Provider) => Promise<void>;
  linkOAuthProvider: (provider: Provider) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      await reconcileProfileAfterAuth();
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
    } finally {
      setProfileLoading(false);
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

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);

      if (event === 'USER_UPDATED' && nextSession?.user) {
        void loadProfile(nextSession.user.id);
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
    await reconcileProfileAfterAuth();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;

    const needsEmailConfirmation = !data.session;
    if (data.session?.user) {
      await reconcileProfileAfterAuth();
    }
    return { needsEmailConfirmation };
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(async (provider: Provider) => {
    storeAuthReturnPath();

    const options: { redirectTo?: string; scopes?: string } = {
      redirectTo: getOAuthRedirectUrl(),
    };

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    });
    if (error) throw error;
  }, []);

  const handleLinkOAuthProvider = useCallback(async (provider: Provider) => {
    await linkOAuthProvider(provider);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const user = session?.user ?? null;
  const isAdmin = isApprovedAdmin(profile, user?.email ?? null);
  const linkedProviders = useMemo(() => getLinkedAuthProviders(user), [user]);
  const needsProfileSetup = Boolean(
    user && !loading && !profileLoading && !isProfileComplete(profile),
  );

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      isAdmin,
      needsProfileSetup,
      profileLoading,
      linkedProviders,
      loading,
      signIn,
      signUp,
      signInWithOAuth,
      linkOAuthProvider: handleLinkOAuthProvider,
      resetPasswordForEmail,
      signOut,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      isAdmin,
      needsProfileSetup,
      profileLoading,
      linkedProviders,
      loading,
      signIn,
      signUp,
      signInWithOAuth,
      handleLinkOAuthProvider,
      resetPasswordForEmail,
      signOut,
      refreshProfile,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ProfileSetupModal />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
