-- 답변 대기함: 승인 구급대원·관리자가 pending 질문 전체 조회
-- migration_v3_questions_answers.sql, v3_questions_admin_rls.sql 이후 실행

CREATE OR REPLACE FUNCTION public.can_answer_questions()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_approved_paramedic() OR public.is_approved_admin();
$$;

GRANT EXECUTE ON FUNCTION public.can_answer_questions() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_pending_questions()
RETURNS SETOF public.questions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_answer_questions() THEN
    RAISE EXCEPTION 'not_authorized_question_expert';
  END IF;

  RETURN QUERY
  SELECT q.*
  FROM public.questions q
  WHERE q.status = 'pending'
  ORDER BY q.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_pending_questions() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_question_for_expert(p_question_id UUID)
RETURNS public.questions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.questions;
BEGIN
  IF NOT public.can_answer_questions() THEN
    RAISE EXCEPTION 'not_authorized_question_expert';
  END IF;

  SELECT * INTO v_row
  FROM public.questions
  WHERE id = p_question_id;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_question_for_expert(UUID) TO authenticated;

-- RLS 재확인: 승인 구급대원·관리자 SELECT 허용
DROP POLICY IF EXISTS "questions_select_paramedic" ON public.questions;
CREATE POLICY "questions_select_paramedic" ON public.questions
  FOR SELECT
  TO authenticated
  USING (
    public.is_approved_paramedic()
    AND status IN ('pending', 'answered')
  );

DROP POLICY IF EXISTS "questions_select_admin" ON public.questions;
CREATE POLICY "questions_select_admin" ON public.questions
  FOR SELECT
  TO authenticated
  USING (public.is_approved_admin());

-- 기존 pending 이외 status 정규화 (혹시 잘못 들어간 값 대비)
UPDATE public.questions
SET status = 'pending'
WHERE status IS NULL OR TRIM(status) = '';

NOTIFY pgrst, 'reload schema';
