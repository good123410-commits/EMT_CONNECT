-- EMT Connect V3: 유저 질문 → 구급대원 답변
-- Supabase Dashboard > SQL Editor 에서 실행하세요.

-- ============================================================
-- 1. Helper: 승인된 구급대원 여부
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_approved_paramedic()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role = 'paramedic'
      AND up.is_approved = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 2. questions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);

-- ============================================================
-- 3. answers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    paramedic_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE (question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_paramedic_id ON public.answers(paramedic_id);

-- ============================================================
-- 4. 답변 제출 + 질문 상태 갱신 (원자 처리)
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_paramedic_answer(
    p_question_id UUID,
    p_content TEXT
)
RETURNS public.answers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_answer public.answers;
    v_trimmed TEXT;
BEGIN
    v_trimmed := TRIM(p_content);
    IF v_trimmed IS NULL OR LENGTH(v_trimmed) < 5 THEN
        RAISE EXCEPTION 'answer_too_short';
    END IF;

    IF NOT public.is_approved_paramedic() THEN
        RAISE EXCEPTION 'not_authorized_paramedic';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.questions q
        WHERE q.id = p_question_id AND q.status = 'pending'
    ) THEN
        RAISE EXCEPTION 'question_not_pending';
    END IF;

    INSERT INTO public.answers (question_id, paramedic_id, content)
    VALUES (p_question_id, auth.uid(), v_trimmed)
    RETURNING * INTO v_answer;

    UPDATE public.questions
    SET status = 'answered'
    WHERE id = p_question_id AND status = 'pending';

    RETURN v_answer;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_paramedic_answer(UUID, TEXT) TO authenticated;

-- ============================================================
-- 5. RLS
-- ============================================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- questions: 본인 질문 조회
DROP POLICY IF EXISTS "questions_select_own" ON public.questions;
CREATE POLICY "questions_select_own" ON public.questions
  FOR SELECT USING (auth.uid() = user_id);

-- questions: 승인 구급대원 — pending 전체 + answered(답변 완료 건) 조회
DROP POLICY IF EXISTS "questions_select_paramedic" ON public.questions;
CREATE POLICY "questions_select_paramedic" ON public.questions
  FOR SELECT USING (
    public.is_approved_paramedic()
    AND (status = 'pending' OR status = 'answered')
  );

-- questions: 로그인 유저 질문 등록 (본인 user_id만)
DROP POLICY IF EXISTS "questions_insert_authenticated" ON public.questions;
CREATE POLICY "questions_insert_authenticated" ON public.questions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
    )
  );

-- questions: status 변경은 RPC만 (직접 UPDATE 차단)
DROP POLICY IF EXISTS "questions_update_none" ON public.questions;
-- 일반 유저/구급대원 직접 UPDATE 불가 — 필요 시 service_role 또는 RPC만

-- answers: 질문 작성자가 본인 질문에 달린 답변 조회
DROP POLICY IF EXISTS "answers_select_question_owner" ON public.answers;
CREATE POLICY "answers_select_question_owner" ON public.answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = answers.question_id AND q.user_id = auth.uid()
    )
  );

-- answers: 승인 구급대원 조회
DROP POLICY IF EXISTS "answers_select_paramedic" ON public.answers;
CREATE POLICY "answers_select_paramedic" ON public.answers
  FOR SELECT USING (public.is_approved_paramedic());

-- answers: 승인 구급대원만 INSERT (paramedic_id = 본인)
DROP POLICY IF EXISTS "answers_insert_paramedic" ON public.answers;
CREATE POLICY "answers_insert_paramedic" ON public.answers
  FOR INSERT WITH CHECK (
    public.is_approved_paramedic()
    AND paramedic_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id AND q.status = 'pending'
    )
  );

-- answers: 일반 유저 INSERT 명시적 거부 — 정책 없음 = 불가

-- ============================================================
-- 6. Realtime
-- ============================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
