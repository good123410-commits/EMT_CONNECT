-- 로그인한 모든 사용자 질문 등록 허용 (RLS + 프로필 자동 생성)
-- migration_v3_questions_answers.sql, v10 이후 SQL Editor에서 실행

-- 1) 로그인 사용자 프로필 자동 생성 (RLS 우회)
CREATE OR REPLACE FUNCTION public.ensure_my_user_profile()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.user_profiles (id, email, role, is_approved)
  SELECT u.id, u.email, 'user', false
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

  RETURN v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_my_user_profile() TO authenticated;

-- 2) 질문 등록 RPC (프로필 보장 후 INSERT — SECURITY DEFINER)
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
  v_uid := public.ensure_my_user_profile();

  v_title := TRIM(p_title);
  v_content := TRIM(p_content);
  IF v_title IS NULL OR LENGTH(v_title) < 2 THEN
    RAISE EXCEPTION 'title_too_short';
  END IF;
  IF v_content IS NULL OR LENGTH(v_content) < 5 THEN
    RAISE EXCEPTION 'content_too_short';
  END IF;

  INSERT INTO public.questions (user_id, title, content, status)
  VALUES (v_uid, v_title, v_content, 'pending')
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_question(TEXT, TEXT) TO authenticated;

-- 3) RLS: 로그인 사용자는 본인 user_id로 pending 질문만 등록 (프로필 EXISTS 조건 제거)
DROP POLICY IF EXISTS "questions_insert_authenticated" ON public.questions;
CREATE POLICY "questions_insert_authenticated" ON public.questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- 4) 등록 직후 본인 행 조회 (INSERT ... RETURNING / select)
DROP POLICY IF EXISTS "questions_select_own" ON public.questions;
CREATE POLICY "questions_select_own" ON public.questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.questions TO authenticated;

NOTIFY pgrst, 'reload schema';
