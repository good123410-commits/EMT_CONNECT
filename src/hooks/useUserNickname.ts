import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { resolveUserNickname } from '@/utils/userNickname';

/** 로그인 사용자의 표시 별명 (프로필 nickname → name → auth metadata) */
export function useUserNickname(): string | null {
  const { user, profile } = useAuth();
  return useMemo(() => resolveUserNickname({ profile, user }), [profile, user]);
}
