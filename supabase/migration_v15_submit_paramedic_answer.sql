-- 답변 제출 RPC: 관리자·승인 구급대원 모두 허용
-- migration_v13_questions_expert_inbox.sql 이후 실행

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
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_trimmed := TRIM(p_content);
  IF v_trimmed IS NULL OR LENGTH(v_trimmed) < 5 THEN
    RAISE EXCEPTION 'answer_too_short';
  END IF;

  IF NOT public.can_answer_questions() THEN
    RAISE EXCEPTION 'not_authorized_paramedic';
  END IF;

  INSERT INTO public.user_profiles (id, email, role, is_approved)
  SELECT u.id, u.email, 'user', false
  FROM auth.users u
  WHERE u.id = v_uid
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = v_uid) THEN
    RAISE EXCEPTION 'user_profile_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.id = p_question_id AND q.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'question_not_pending';
  END IF;

  INSERT INTO public.answers (question_id, paramedic_id, content)
  VALUES (p_question_id, v_uid, v_trimmed)
  RETURNING * INTO v_answer;

  UPDATE public.questions
  SET status = 'answered'
  WHERE id = p_question_id AND status = 'pending';

  RETURN v_answer;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_paramedic_answer(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
