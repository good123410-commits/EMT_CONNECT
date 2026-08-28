-- EMS 커뮤니티 작성자 표시명: 프로필 별명 우선
-- 선행: migration_v39 (user_profiles.nickname), migration_v59, migration_v67

CREATE OR REPLACE FUNCTION public.resolve_user_display_name(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(up.nickname), ''),
    NULLIF(TRIM(up.name), ''),
    '회원'
  )
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
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
  v_label TEXT;
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

  v_label := public.resolve_user_display_name(v_uid);

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
    v_label
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_community_bamboo_post(
  p_title TEXT,
  p_content TEXT,
  p_category_id UUID DEFAULT NULL,
  p_category_slug TEXT DEFAULT 'question',
  p_anonymous_label TEXT DEFAULT NULL,
  p_is_secret BOOLEAN DEFAULT false
)
RETURNS public.ems_community_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_title TEXT := NULLIF(TRIM(p_title), '');
  v_content TEXT := TRIM(p_content);
  v_label TEXT := NULLIF(TRIM(p_anonymous_label), '');
  v_category_id UUID := p_category_id;
  v_summary TEXT;
  v_row public.ems_community_posts;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_title IS NULL OR LENGTH(v_title) < 2 THEN
    RAISE EXCEPTION 'title_too_short';
  END IF;
  IF LENGTH(v_content) < 5 THEN
    RAISE EXCEPTION 'content_too_short';
  END IF;

  IF v_category_id IS NULL AND p_category_slug IS NOT NULL THEN
    SELECT c.id INTO v_category_id
    FROM public.kemix_community_categories c
    WHERE c.slug = TRIM(p_category_slug) AND c.is_active = true
    LIMIT 1;
  END IF;

  v_summary := LEFT(REGEXP_REPLACE(v_content, '<[^>]+>', ' ', 'g'), 160);

  IF v_label IS NULL OR v_label IN ('회원', '익명') THEN
    v_label := public.resolve_user_display_name(v_uid);
  END IF;

  INSERT INTO public.ems_community_posts (
    post_type, title, summary, content, author_id, anonymous_label, category_id, is_secret
  ) VALUES (
    'bamboo',
    v_title,
    NULLIF(TRIM(v_summary), ''),
    v_content,
    v_uid,
    v_label,
    v_category_id,
    COALESCE(p_is_secret, false)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_post_comment(
  p_post_id UUID,
  p_content TEXT,
  p_parent_id UUID DEFAULT NULL,
  p_anonymous_label TEXT DEFAULT NULL
)
RETURNS public.ems_community_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_content TEXT := TRIM(p_content);
  v_label TEXT := NULLIF(TRIM(p_anonymous_label), '');
  v_parent public.ems_community_comments;
  v_row public.ems_community_comments;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF LENGTH(v_content) < 1 THEN RAISE EXCEPTION 'content_too_short'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ems_community_posts p
    WHERE p.id = p_post_id AND p.is_hidden = false
  ) THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  IF p_parent_id IS NOT NULL THEN
    SELECT * INTO v_parent FROM public.ems_community_comments WHERE id = p_parent_id;
    IF v_parent.id IS NULL OR v_parent.post_id <> p_post_id THEN
      RAISE EXCEPTION 'invalid_parent';
    END IF;
    IF v_parent.parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'max_reply_depth';
    END IF;
  END IF;

  IF v_label IS NULL OR v_label IN ('회원', '익명') THEN
    v_label := public.resolve_user_display_name(v_uid);
  END IF;

  INSERT INTO public.ems_community_comments (
    post_id, parent_id, author_id, anonymous_label, content
  ) VALUES (
    p_post_id, p_parent_id, v_uid, v_label, v_content
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_user_display_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ems_case_study_post(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_community_bamboo_post(TEXT, TEXT, UUID, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_post_comment(UUID, TEXT, UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
