-- 질문 등록 RPC (프로필 자동 보장 + RLS 우회 없이 auth.uid() 검증)
-- migration_v3_questions_answers.sql 실행 후 적용

CREATE OR REPLACE FUNCTION public.create_user_question(
  p_title TEXT,
  p_content TEXT
)
RETURNS public.questions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_title TEXT;
  v_content TEXT;
  v_row public.questions;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_title := TRIM(p_title);
  v_content := TRIM(p_content);
  IF v_title IS NULL OR LENGTH(v_title) < 2 THEN
    RAISE EXCEPTION 'title_too_short';
  END IF;
  IF v_content IS NULL OR LENGTH(v_content) < 5 THEN
    RAISE EXCEPTION 'content_too_short';
  END IF;

  INSERT INTO public.user_profiles (id, email, role, is_approved)
  SELECT
    u.id,
    u.email,
    'user',
    false
  FROM auth.users u
  WHERE u.id = v_uid
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = v_uid) THEN
    INSERT INTO public.user_profiles (id, email, role, is_approved)
    SELECT
      p.id,
      u.email,
      CASE
        WHEN p.role IN ('hospital', 'paramedic', 'private_ems', 'admin') THEN p.role
        WHEN p.role = 'emt_certified' THEN 'paramedic'
        ELSE 'user'
      END,
      COALESCE(p.is_approved, false)
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.id = v_uid
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = v_uid) THEN
    RAISE EXCEPTION 'user_profile_missing';
  END IF;

  INSERT INTO public.questions (user_id, title, content, status)
  VALUES (v_uid, v_title, v_content, 'pending')
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_question(TEXT, TEXT) TO authenticated;
