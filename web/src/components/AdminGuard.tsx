import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, isAdmin, user } = useAuth();

  if (loading) return <p className="muted container page-content">확인 중…</p>;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
