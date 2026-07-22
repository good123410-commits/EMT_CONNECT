-- KEMIX 웹 1:1 문의 (FAQ와 분리, 작성자·관리자만 조회)
-- migration_v40 이후 SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS public.kemix_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  admin_answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  answered_at TIMESTAMPTZ,
  answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_inquiries_user_id ON public.kemix_inquiries (user_id);
CREATE INDEX IF NOT EXISTS idx_kemix_inquiries_status ON public.kemix_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_kemix_inquiries_created_at ON public.kemix_inquiries (created_at DESC);

ALTER TABLE public.kemix_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_inquiries_select_own_or_admin" ON public.kemix_inquiries;
CREATE POLICY "kemix_inquiries_select_own_or_admin"
  ON public.kemix_inquiries FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_approved_admin());

DROP POLICY IF EXISTS "kemix_inquiries_insert_own" ON public.kemix_inquiries;
CREATE POLICY "kemix_inquiries_insert_own"
  ON public.kemix_inquiries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "kemix_inquiries_admin_all" ON public.kemix_inquiries;
CREATE POLICY "kemix_inquiries_admin_all"
  ON public.kemix_inquiries FOR ALL TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 사용자 문의 등록
CREATE OR REPLACE FUNCTION public.create_my_inquiry(
  p_title TEXT,
  p_content TEXT
)
RETURNS public.kemix_inquiries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_title TEXT := TRIM(p_title);
  v_content TEXT := TRIM(p_content);
  v_row public.kemix_inquiries;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  PERFORM public.ensure_my_user_profile();

  IF LENGTH(v_title) < 2 THEN RAISE EXCEPTION 'title_too_short'; END IF;
  IF LENGTH(v_content) < 5 THEN RAISE EXCEPTION 'content_too_short'; END IF;

  INSERT INTO public.kemix_inquiries (user_id, title, content, status)
  VALUES (v_uid, v_title, v_content, 'pending')
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_my_inquiry(TEXT, TEXT) TO authenticated;

-- 본인 문의 목록
CREATE OR REPLACE FUNCTION public.list_my_inquiries()
RETURNS SETOF public.kemix_inquiries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  RETURN QUERY
  SELECT *
  FROM public.kemix_inquiries ki
  WHERE ki.user_id = v_uid
  ORDER BY ki.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_inquiries() TO authenticated;

-- 단건 조회 (본인·관리자만, 그 외 비밀글)
CREATE OR REPLACE FUNCTION public.get_inquiry_if_allowed(p_id UUID)
RETURNS public.kemix_inquiries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.kemix_inquiries;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_row FROM public.kemix_inquiries WHERE id = p_id;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'inquiry_not_found';
  END IF;

  IF v_row.user_id <> v_uid AND NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'inquiry_secret';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_inquiry_if_allowed(UUID) TO authenticated;

-- 관리자: 전체 문의 목록
CREATE OR REPLACE FUNCTION public.admin_list_inquiries()
RETURNS SETOF public.kemix_inquiries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.kemix_inquiries
  ORDER BY
    CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
    created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_inquiries() TO authenticated;

-- 관리자: 답변 등록/수정
CREATE OR REPLACE FUNCTION public.admin_answer_inquiry(
  p_id UUID,
  p_answer TEXT
)
RETURNS public.kemix_inquiries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_answer TEXT := TRIM(p_answer);
  v_row public.kemix_inquiries;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF LENGTH(v_answer) < 2 THEN
    RAISE EXCEPTION 'answer_too_short';
  END IF;

  UPDATE public.kemix_inquiries
  SET
    admin_answer = v_answer,
    status = 'answered',
    answered_at = TIMEZONE('utc'::text, NOW()),
    answered_by = auth.uid(),
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'inquiry_not_found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_answer_inquiry(UUID, TEXT) TO authenticated;

-- 관리자: 문의 삭제
CREATE OR REPLACE FUNCTION public.admin_delete_inquiry(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.kemix_inquiries WHERE id = p_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_inquiry(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
