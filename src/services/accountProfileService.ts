import { supabase } from '@/lib/supabaseClient';
import { updateProfileFields } from '@/services/profileService';

export function userHasEmailPasswordAuth(identities: { provider: string }[] | undefined): boolean {
  return identities?.some((identity) => identity.provider === 'email') ?? false;
}

function normalizeNickname(value: string): string {
  return value.trim();
}

export async function changeAccountPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const trimmedCurrent = currentPassword.trim();
  const trimmedNew = newPassword.trim();

  if (!trimmedCurrent) {
    throw new Error('현재 비밀번호를 입력해 주세요.');
  }
  if (trimmedNew.length < 8) {
    throw new Error('새 비밀번호는 8자 이상이어야 합니다.');
  }
  if (trimmedCurrent === trimmedNew) {
    throw new Error('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: trimmedCurrent,
  });
  if (signInError) {
    throw new Error('현재 비밀번호가 올바르지 않습니다.');
  }

  const { error } = await supabase.auth.updateUser({ password: trimmedNew });
  if (error) throw error;
}

export async function updateAccountNickname(userId: string, nickname: string): Promise<void> {
  const trimmed = normalizeNickname(nickname);
  if (!trimmed) {
    throw new Error('별명을 입력해 주세요.');
  }
  if (trimmed.length < 2 || trimmed.length > 20) {
    throw new Error('별명은 2~20자로 입력해 주세요.');
  }

  await updateProfileFields(userId, { name: trimmed, nickname: trimmed });
  const { error } = await supabase.auth.updateUser({
    data: { name: trimmed, nickname: trimmed },
  });
  if (error) throw error;
}

export async function updateAccountPhone(userId: string, phone: string): Promise<void> {
  const trimmed = phone.trim();
  if (!trimmed) {
    throw new Error('전화번호를 입력해 주세요.');
  }

  await updateProfileFields(userId, { phone: trimmed });
  const { error } = await supabase.auth.updateUser({ data: { phone: trimmed } });
  if (error) throw error;
}
