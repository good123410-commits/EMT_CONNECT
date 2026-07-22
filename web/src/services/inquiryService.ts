import { supabase } from '../lib/supabase';
import type { InquiryStatus, KemixInquiry } from '../types';

function mapInquiry(row: Record<string, unknown>): KemixInquiry {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    title: String(row.title ?? ''),
    content: String(row.content ?? ''),
    admin_answer: typeof row.admin_answer === 'string' ? row.admin_answer : null,
    status: row.status === 'answered' ? 'answered' : 'pending',
    answered_at: typeof row.answered_at === 'string' ? row.answered_at : null,
    answered_by: typeof row.answered_by === 'string' ? row.answered_by : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
  };
}

export function inquiryStatusLabel(status: InquiryStatus | string): string {
  return status === 'answered' ? '답변 완료' : '답변 대기';
}
export async function createInquiry(title: string, content: string): Promise<KemixInquiry> {
  const { data, error } = await supabase.rpc('create_my_inquiry', {
    p_title: title.trim(),
    p_content: content.trim(),
  });
  if (error) throw new Error(error.message);
  return mapInquiry(data as Record<string, unknown>);
}

export async function fetchMyInquiries(): Promise<KemixInquiry[]> {
  const { data, error } = await supabase.rpc('list_my_inquiries');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => mapInquiry(row));
}

export async function fetchInquiryIfAllowed(id: string): Promise<KemixInquiry> {
  const { data, error } = await supabase.rpc('get_inquiry_if_allowed', { p_id: id });
  if (error) {
    if (error.message.includes('inquiry_secret')) {
      throw new Error('비밀글입니다. 본인 또는 관리자만 열람할 수 있습니다.');
    }
    throw new Error(error.message);
  }
  return mapInquiry(data as Record<string, unknown>);
}

export async function adminListInquiries(): Promise<KemixInquiry[]> {
  const { data, error } = await supabase.rpc('admin_list_inquiries');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => mapInquiry(row));
}

export async function adminAnswerInquiry(id: string, answer: string): Promise<KemixInquiry> {
  const { data, error } = await supabase.rpc('admin_answer_inquiry', {
    p_id: id,
    p_answer: answer.trim(),
  });
  if (error) {
    if (error.message.includes('answer_too_short')) {
      throw new Error('답변은 2자 이상 입력해 주세요.');
    }
    throw new Error(error.message);
  }
  return mapInquiry(data as Record<string, unknown>);
}

export async function adminDeleteInquiry(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_inquiry', { p_id: id });
  if (error) throw new Error(error.message);
}
