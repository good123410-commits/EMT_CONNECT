import {
  ANSWERS_TABLE,
  QUESTIONS_TABLE,
  supabase,
  type ParamedicAnswer,
  type QuestionStatus,
  type UserQuestion,
  type UserQuestionWithAnswer,
} from '@/lib/supabaseClient';
import {
  subscribePendingQuestionsChanges,
  subscribeUserQuestionsChanges,
} from '@/lib/realtimeSubscription';
import { ensureProfile } from '@/services/profileService';

export class QuestionServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuestionServiceError';
  }
}

function mapQuestion(row: Record<string, unknown>): UserQuestion {
  const rawStatus = String(row.status ?? 'pending').trim().toLowerCase();
  const status: QuestionStatus = rawStatus === 'answered' ? 'answered' : 'pending';

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? ''),
    content: String(row.content ?? ''),
    status,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapAnswer(row: Record<string, unknown>): ParamedicAnswer {
  return {
    id: String(row.id),
    question_id: String(row.question_id),
    paramedic_id: String(row.paramedic_id),
    content: String(row.content ?? ''),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function parseRpcError(message: string): string {
  if (message.includes('user_profile_missing')) {
    return '회원 프로필을 만들 수 없습니다. 설정에서 로그아웃 후 다시 가입·로그인해 주세요.';
  }
  if (message.includes('not_authenticated')) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.';
  }
  if (message.includes('title_too_short')) {
    return '제목을 2자 이상 입력해 주세요.';
  }
  if (message.includes('content_too_short')) {
    return '내용을 5자 이상 입력해 주세요.';
  }
  if (message.includes('not_authorized_paramedic')) {
    return '승인된 구급대원 또는 관리자 계정만 답변할 수 있습니다.';
  }
  if (message.includes('not_authorized_question_expert')) {
    return '답변함 조회 권한이 없습니다. user_profiles에서 role이 admin 또는 paramedic이고 is_approved=true인지 확인해 주세요.';
  }
  if (message.includes('question_not_pending')) {
    return '이미 답변이 완료된 질문입니다.';
  }
  if (message.includes('answer_too_short')) {
    return '답변은 5자 이상 입력해 주세요.';
  }
  if (message.includes('row-level security') || message.includes('42501')) {
    return '질문을 등록할 권한이 없습니다. Supabase에서 migration_v12_questions_insert_authenticated.sql을 실행한 뒤 다시 시도해 주세요.';
  }
  if (message.includes('violates foreign key') || message.includes('23503')) {
    return '회원 프로필이 준비되지 않았습니다. 로그아웃 후 다시 로그인해 주세요.';
  }
  if (message.includes('relation') && message.includes('questions') && message.includes('does not exist')) {
    return '질문 기능 DB가 아직 설치되지 않았습니다. Supabase에서 migration_v3_questions_answers.sql을 실행해 주세요.';
  }
  if (message.includes('회원 프로필')) {
    return message;
  }
  return message;
}

function normalizeRpcAnswerRow(data: unknown): Record<string, unknown> | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    const first = data[0];
    return first && typeof first === 'object' ? (first as Record<string, unknown>) : null;
  }
  if (typeof data === 'object') return data as Record<string, unknown>;
  return null;
}

function normalizeRpcQuestionRow(data: unknown): Record<string, unknown> | null {
  return normalizeRpcAnswerRow(data);
}

function isMissingRpcError(message: string, code?: string, functionName?: string): boolean {
  if (code === 'PGRST202') return true;
  const lower = message.toLowerCase();
  if (lower.includes('could not find the function')) return true;
  if (functionName && lower.includes(functionName.toLowerCase())) return true;
  return (
    lower.includes('create_user_question') && lower.includes('schema')
  );
}

export async function createQuestion(
  userId: string,
  title: string,
  content: string,
  profileHint?: { name?: string; email?: string },
): Promise<UserQuestion> {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (trimmedTitle.length < 2) {
    throw new QuestionServiceError('제목을 2자 이상 입력해 주세요.');
  }
  if (trimmedContent.length < 5) {
    throw new QuestionServiceError('내용을 5자 이상 입력해 주세요.');
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser?.id || authUser.id !== userId) {
    throw new QuestionServiceError('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
  }

  try {
    await ensureProfile(
      userId,
      profileHint?.name ?? (authUser.user_metadata?.name as string | undefined),
      profileHint?.email ?? authUser.email ?? undefined,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '회원 프로필을 준비하지 못했습니다.';
    throw new QuestionServiceError(parseRpcError(msg));
  }

  const { data: rpcRow, error: rpcError } = await supabase.rpc('create_user_question', {
    p_title: trimmedTitle,
    p_content: trimmedContent,
  });

  const normalizedRpc = normalizeRpcQuestionRow(rpcRow);
  if (!rpcError && normalizedRpc?.id) {
    const question = mapQuestion(normalizedRpc);
    if (question.status !== 'pending') {
      throw new QuestionServiceError('질문이 정상적으로 등록되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    }
    return question;
  }

  if (rpcError && !isMissingRpcError(rpcError.message, rpcError.code)) {
    throw new QuestionServiceError(parseRpcError(rpcError.message));
  }

  // RPC 미배포 시: 직접 INSERT (v12 RLS 정책 필요, ensureProfile에서 프로필 이미 시도)
  const { data, error } = await supabase
    .from(QUESTIONS_TABLE)
    .insert({
      user_id: userId,
      title: trimmedTitle,
      content: trimmedContent,
      status: 'pending' as const,
    })
    .select('id,user_id,title,content,status,created_at')
    .single();

  if (error) throw new QuestionServiceError(parseRpcError(error.message));
  if (!data?.id || data.status !== 'pending') {
    throw new QuestionServiceError('질문이 정상적으로 등록되지 않았습니다. 잠시 후 다시 시도해 주세요.');
  }
  return mapQuestion(data as Record<string, unknown>);
}

export type MyQuestionsPageResult = {
  items: UserQuestionWithAnswer[];
  hasMore: boolean;
};

function mergeQuestionsWithAnswers(
  rows: Record<string, unknown>[],
  answers: Record<string, unknown>[] | null,
): UserQuestionWithAnswer[] {
  const answerByQuestion = new Map<string, ParamedicAnswer>();
  for (const row of answers ?? []) {
    const answer = mapAnswer(row);
    answerByQuestion.set(answer.question_id, answer);
  }

  return rows.map((row) => {
    const question = mapQuestion(row);
    return {
      ...question,
      answer: answerByQuestion.get(question.id) ?? null,
    };
  });
}

export async function fetchMyQuestionsPage(
  userId: string,
  page: number,
  pageSize = 20,
): Promise<MyQuestionsPageResult> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data: questions, error: qError } = await supabase
    .from(QUESTIONS_TABLE)
    .select('id,user_id,title,content,status,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (qError) throw new QuestionServiceError(qError.message);

  const rows = (questions ?? []) as Record<string, unknown>[];
  if (rows.length === 0) {
    return { items: [], hasMore: false };
  }

  const questionIds = rows.map((q) => String(q.id));
  const { data: answers, error: aError } = await supabase
    .from(ANSWERS_TABLE)
    .select('id,question_id,paramedic_id,content,created_at')
    .in('question_id', questionIds);

  if (aError) throw new QuestionServiceError(aError.message);

  return {
    items: mergeQuestionsWithAnswers(rows, (answers ?? []) as Record<string, unknown>[]),
    hasMore: rows.length === pageSize,
  };
}

export async function fetchMyQuestions(userId: string): Promise<UserQuestionWithAnswer[]> {
  const { data: questions, error: qError } = await supabase
    .from(QUESTIONS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (qError) throw new QuestionServiceError(qError.message);

  const rows = (questions ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return [];

  const questionIds = rows.map((q) => String(q.id));
  const { data: answers, error: aError } = await supabase
    .from(ANSWERS_TABLE)
    .select('*')
    .in('question_id', questionIds);

  if (aError) throw new QuestionServiceError(aError.message);

  return mergeQuestionsWithAnswers(rows, (answers ?? []) as Record<string, unknown>[]);
}

export type QuestionOverview = {
  pending: number;
  answered: number;
  total: number;
};

export type AdminQuestionRow = UserQuestion & {
  answer: ParamedicAnswer | null;
};

export async function adminListQuestions(
  filter: 'all' | QuestionStatus = 'all',
): Promise<AdminQuestionRow[]> {
  let query = supabase.from(QUESTIONS_TABLE).select('*').order('created_at', { ascending: false }).limit(200);

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: questions, error: qError } = await query;
  if (qError) throw new QuestionServiceError(qError.message);

  const qRows = (questions ?? []) as Record<string, unknown>[];
  if (qRows.length === 0) return [];

  const ids = qRows.map((q) => String(q.id));
  const { data: answers, error: aError } = await supabase
    .from(ANSWERS_TABLE)
    .select('*')
    .in('question_id', ids);

  if (aError) throw new QuestionServiceError(aError.message);

  const answerMap = new Map<string, ParamedicAnswer>();
  for (const row of (answers ?? []) as Record<string, unknown>[]) {
    const answer = mapAnswer(row);
    answerMap.set(answer.question_id, answer);
  }

  return qRows.map((row) => {
    const question = mapQuestion(row);
    return { ...question, answer: answerMap.get(question.id) ?? null };
  });
}

export async function adminUpdateQuestion(
  id: string,
  input: { title: string; content: string; status: QuestionStatus },
): Promise<UserQuestion> {
  const { data, error } = await supabase
    .from(QUESTIONS_TABLE)
    .update({
      title: input.title.trim(),
      content: input.content.trim(),
      status: input.status,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw new QuestionServiceError(error.message);
  if (!data) {
    throw new QuestionServiceError(
      '질문이 수정되지 않았습니다. migration_v9_admin_questions_ambulance.sql의 RLS 정책을 확인해 주세요.',
    );
  }
  return mapQuestion(data as Record<string, unknown>);
}

export async function adminDeleteQuestion(id: string): Promise<void> {
  const { error: answerError } = await supabase.from(ANSWERS_TABLE).delete().eq('question_id', id);
  if (answerError) throw new QuestionServiceError(answerError.message);

  const { data, error } = await supabase.from(QUESTIONS_TABLE).delete().eq('id', id).select('id');
  if (error) throw new QuestionServiceError(error.message);
  if (!data?.length) {
    throw new QuestionServiceError('질문이 삭제되지 않았습니다. 관리자 권한을 확인해 주세요.');
  }
}

export async function fetchQuestionOverview(): Promise<QuestionOverview> {
  const { data, error } = await supabase.from(QUESTIONS_TABLE).select('status');

  if (error) throw new QuestionServiceError(error.message);

  const rows = (data ?? []) as { status: string }[];
  const pending = rows.filter((r) => r.status === 'pending').length;
  const answered = rows.filter((r) => r.status === 'answered').length;

  return { pending, answered, total: rows.length };
}

export async function fetchPendingQuestions(): Promise<UserQuestion[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('list_pending_questions');

  if (!rpcError && Array.isArray(rpcData)) {
    return rpcData.map((row) => mapQuestion(row as Record<string, unknown>));
  }

  if (rpcError && !isMissingRpcError(rpcError.message, rpcError.code, 'list_pending_questions')) {
    throw new QuestionServiceError(parseRpcError(rpcError.message));
  }

  const { data, error } = await supabase
    .from(QUESTIONS_TABLE)
    .select('id,user_id,title,content,status,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new QuestionServiceError(parseRpcError(error.message));
  return ((data ?? []) as Record<string, unknown>[]).map(mapQuestion);
}

export async function fetchQuestionForExpert(questionId: string): Promise<UserQuestion | null> {
  const { data, error } = await supabase.rpc('get_question_for_expert', {
    p_question_id: questionId,
  });

  if (!error) {
    const row = normalizeRpcQuestionRow(data);
    if (!row?.id) return null;
    return mapQuestion(row);
  }

  if (!isMissingRpcError(error.message, error.code, 'get_question_for_expert')) {
    throw new QuestionServiceError(parseRpcError(error.message));
  }

  return fetchQuestionById(questionId);
}

export async function fetchQuestionById(questionId: string): Promise<UserQuestion | null> {
  const { data, error } = await supabase
    .from(QUESTIONS_TABLE)
    .select('*')
    .eq('id', questionId)
    .maybeSingle();

  if (error) throw new QuestionServiceError(error.message);
  if (!data) return null;
  return mapQuestion(data as Record<string, unknown>);
}

/** RPC: answers 저장 + questions.status = answered 원자 처리 */
export async function submitParamedicAnswer(
  questionId: string,
  content: string,
): Promise<ParamedicAnswer> {
  const trimmed = content.trim();
  if (trimmed.length < 5) {
    throw new QuestionServiceError('답변은 5자 이상 입력해 주세요.');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    throw new QuestionServiceError('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
  }

  try {
    await ensureProfile(
      user.id,
      user.user_metadata?.name as string | undefined,
      user.email ?? undefined,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '회원 프로필을 준비하지 못했습니다.';
    throw new QuestionServiceError(parseRpcError(msg));
  }

  const { data, error } = await supabase.rpc('submit_paramedic_answer', {
    p_question_id: questionId,
    p_content: trimmed,
  });

  if (error) {
    throw new QuestionServiceError(parseRpcError(error.message));
  }

  const row = normalizeRpcAnswerRow(data);
  if (!row?.id) {
    throw new QuestionServiceError(
      '답변 저장 응답을 확인하지 못했습니다. migration_v15_submit_paramedic_answer.sql 적용 여부를 확인해 주세요.',
    );
  }

  return mapAnswer(row);
}

export function subscribeMyQuestions(
  userId: string,
  onChange: (questions: UserQuestionWithAnswer[]) => void,
): () => void {
  let active = true;

  const reload = () => {
    void fetchMyQuestions(userId).then((items) => {
      if (active) onChange(items);
    });
  };

  reload();
  const unsubscribe = subscribeUserQuestionsChanges(userId, reload);

  return () => {
    active = false;
    unsubscribe();
  };
}

export function subscribePendingQuestions(
  onChange: (questions: UserQuestion[]) => void,
): () => void {
  let active = true;

  const reload = () => {
    void fetchPendingQuestions().then((items) => {
      if (active) onChange(items);
    });
  };

  reload();
  const unsubscribe = subscribePendingQuestionsChanges(reload);

  return () => {
    active = false;
    unsubscribe();
  };
}
