import type { User } from '@supabase/supabase-js';
import { supabase, type UserProfile } from '@/lib/supabaseClient';
import { fetchProfile } from '@/services/profileService';

export class MissingNicknameError extends Error {
  constructor() {
    super('별명을 먼저 설정해 주세요. 설정 > 프로필에서 별명을 등록할 수 있습니다.');
    this.name = 'MissingNicknameError';
  }
}

type NicknameProfile = Pick<UserProfile, 'name'> & { nickname?: string | null };

export type NicknameSource = {
  profile?: NicknameProfile | null;
  user?: User | null;
};

export function resolveUserNickname({ profile, user }: NicknameSource): string | null {
  const candidates = [
    profile?.nickname,
    profile?.name,
    user?.user_metadata?.nickname as string | undefined,
    user?.user_metadata?.name as string | undefined,
    user?.email?.split('@')[0],
  ];

  for (const value of candidates) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

export function requireUserNickname(source: NicknameSource): string {
  const nickname = resolveUserNickname(source);
  if (!nickname) {
    throw new MissingNicknameError();
  }
  return nickname;
}

export async function fetchCurrentUserNickname(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) {
    throw new Error('로그인 후 이용할 수 있습니다.');
  }

  const profile = await fetchProfile(auth.user.id);
  return requireUserNickname({ profile, user: auth.user });
}

export function parseNicknameError(error: unknown): string {
  if (error instanceof MissingNicknameError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '작성자 정보를 확인할 수 없습니다.';
}
