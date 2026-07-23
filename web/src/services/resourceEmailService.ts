import { supabase } from '../lib/supabase';

export type SendResourceEmailInput = {
  to: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
};

export async function sendResourceByEmail(input: SendResourceEmailInput): Promise<void> {
  const { data: sessionWrap } = await supabase.auth.getSession();
  const accessToken = sessionWrap.session?.access_token;

  const { data, error } = await supabase.functions.invoke('send-resource-email', {
    body: {
      to: input.to.trim(),
      title: input.title,
      description: input.description,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
    },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (error) {
    throw new Error(error.message || '이메일 전송에 실패했습니다.');
  }

  const result = data as { success?: boolean; error?: string } | null;
  if (result?.error) {
    if (result.error === 'email_not_configured') {
      throw new Error('이메일 발송 서비스가 설정되지 않았습니다. 관리자에게 문의해 주세요.');
    }
    throw new Error(result.error);
  }

  if (!result?.success) {
    throw new Error('이메일 전송에 실패했습니다.');
  }
}
