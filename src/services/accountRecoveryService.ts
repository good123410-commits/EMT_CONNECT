import { supabase } from '@/lib/supabaseClient';
import { resetPasswordForEmail } from '@/services/authService';

function mapFindEmailError(message: string): string {
  if (message.includes('name_required') || message.includes('phone_required')) {
    return '이름과 휴대전화번호를 올바르게 입력해 주세요.';
  }
  if (message.includes('ambiguous_identity')) {
    return '일치하는 정보가 여러 건입니다. 고객센터로 문의해 주세요.';
  }
  return '아이디 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export async function findMaskedEmailByNamePhone(
  name: string,
  phone: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('find_email_hint_by_name_phone', {
    p_name: name.trim(),
    p_phone: phone.trim(),
  });

  if (error) {
    throw new Error(mapFindEmailError(error.message));
  }

  return typeof data === 'string' && data.length > 0 ? data : null;
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  await resetPasswordForEmail(email);
}

export function getPasswordResetErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (lower.includes('invalid') && lower.includes('email')) {
    return '올바른 이메일 주소를 입력해 주세요.';
  }
  return message || '재설정 메일 발송에 실패했습니다. 다시 시도해 주세요.';
}
