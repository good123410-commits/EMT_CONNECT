import type { User } from '@supabase/supabase-js';
import { getConnectedProviders } from './authService';
import { updateProfileFields } from './profileService';
import { supabase } from '../lib/supabase';

export function userHasEmailPasswordAuth(user: User | null): boolean {
  return getConnectedProviders(user).includes('email');
}

function mapAccountProfileError(message: string): string {
  if (message.includes('nickname_taken')) {
    return '이미 사용 중인 별명입니다. 다른 별명을 입력해 주세요.';
  }
  if (message.includes('nickname_length_invalid')) {
    return '별명은 2~20자로 입력해 주세요.';
  }
  return message || '프로필 저장에 실패했습니다.';
}

function validateNickname(nickname: string): string {
  const trimmed = nickname.trim();
  if (!trimmed) {
    throw new Error('별명을 입력해 주세요.');
  }
  if (trimmed.length < 2 || trimmed.length > 20) {
    throw new Error('별명은 2~20자로 입력해 주세요.');
  }
  return trimmed;
}

function validatePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) {
    throw new Error('전화번호를 입력해 주세요.');
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) {
    throw new Error('올바른 전화번호 형식을 입력해 주세요.');
  }
  return trimmed;
}

export async function changeAccountPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  const trimmedCurrent = currentPassword.trim();
  const trimmedNew = newPassword.trim();
  const trimmedConfirm = confirmPassword.trim();

  if (!trimmedCurrent) {
    throw new Error('현재 비밀번호를 입력해 주세요.');
  }
  if (trimmedNew.length < 8) {
    throw new Error('새 비밀번호는 8자 이상이어야 합니다.');
  }
  if (trimmedNew !== trimmedConfirm) {
    throw new Error('새 비밀번호 확인이 일치하지 않습니다.');
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

/** 앱·웹 공통 user_profiles 스키마 — nickname + name 동시 반영 */
export async function updateAccountNickname(userId: string, nickname: string): Promise<void> {
  const trimmed = validateNickname(nickname);

  try {
    await updateProfileFields(userId, {
      nickname: trimmed,
      name: trimmed,
    });
  } catch (error) {
    throw new Error(
      mapAccountProfileError(error instanceof Error ? error.message : '프로필 저장에 실패했습니다.'),
    );
  }

  const { error } = await supabase.auth.updateUser({
    data: { nickname: trimmed, name: trimmed },
  });
  if (error) throw error;
}

export async function updateAccountPhone(userId: string, phone: string): Promise<void> {
  const trimmed = validatePhone(phone);

  await updateProfileFields(userId, { phone: trimmed });
  const { error } = await supabase.auth.updateUser({ data: { phone: trimmed } });
  if (error) throw error;
}
