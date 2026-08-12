-- EMS 케이스 스터디 작성 RPC (RLS 우회 + 권한 검증)
-- 선행: migration_v17 (can_access_paramedic_community)

CREATE OR REPLACE FUNCTION public.pick_ems_anonymous_label()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT (ARRAY[
    '익명 · 서울',
    '익명 · 경기',
    '익명 · 부산',
    '익명 · 대구',
    '익명 · 광주',
    '익명 · 대전'
  ])[1 + floor(random() * 6)::int];
$$;

CREATE OR REPLACE FUNCTION public.create_ems_case_study_post(
  p_title TEXT,
  p_summary TEXT DEFAULT NULL,
  p_content TEXT DEFAULT NULL
)
RETURNS public.ems_community_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_title TEXT := NULLIF(TRIM(p_title), '');
  v_summary TEXT := NULLIF(TRIM(COALESCE(p_summary, '')), '');
  v_content TEXT := TRIM(COALESCE(p_content, ''));
  v_row public.ems_community_posts;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.can_access_paramedic_community() THEN
    RAISE EXCEPTION 'not_authorized_community';
  END IF;

  IF v_title IS NULL OR LENGTH(v_title) < 4 THEN
    RAISE EXCEPTION 'title_too_short';
  END IF;

  IF LENGTH(v_content) < 10 THEN
    RAISE EXCEPTION 'content_too_short';
  END IF;

  IF v_summary IS NULL THEN
    v_summary := LEFT(v_content, 160);
  END IF;

  INSERT INTO public.ems_community_posts (
    post_type,
    title,
    summary,
    content,
    tags,
    author_id,
    anonymous_label
  ) VALUES (
    'case_study',
    v_title,
    v_summary,
    v_content,
    ARRAY[]::TEXT[],
    v_uid,
    public.pick_ems_anonymous_label()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_ems_case_study_post(TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
