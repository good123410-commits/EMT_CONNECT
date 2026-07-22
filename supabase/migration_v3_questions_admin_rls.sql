-- Admin Q&A 대시보드용 RLS 확장 (migration_v3_questions_answers.sql 실행 후)

CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role = 'admin'
      AND up.is_approved = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- admin: 전체 questions 조회 (대시보드 통계)
DROP POLICY IF EXISTS "questions_select_admin" ON public.questions;
CREATE POLICY "questions_select_admin" ON public.questions
  FOR SELECT USING (public.is_approved_admin());

-- admin: answers 조회
DROP POLICY IF EXISTS "answers_select_admin" ON public.answers;
CREATE POLICY "answers_select_admin" ON public.answers
  FOR SELECT USING (public.is_approved_admin());

-- RPC: admin도 답변 제출 가능 (운영 대응)
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

    IF NOT (public.is_approved_paramedic() OR public.is_approved_admin()) THEN
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
