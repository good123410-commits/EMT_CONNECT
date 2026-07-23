-- Q&A 게시판: 회원 질문 작성 + 구급대원/관리자 답변(댓글) RBAC
-- 선행: migration_v42

CREATE OR REPLACE FUNCTION public.can_write_community_answer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_approved_paramedic() OR public.is_approved_admin();
$$;

GRANT EXECUTE ON FUNCTION public.can_write_community_answer() TO authenticated;

-- 질문글(bamboo) 작성: 가입 회원 누구나
CREATE OR REPLACE FUNCTION public.create_community_bamboo_post(
  p_title TEXT,
  p_content TEXT,
  p_category_id UUID DEFAULT NULL,
  p_category_slug TEXT DEFAULT 'question',
  p_anonymous_label TEXT DEFAULT '회원'
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

  INSERT INTO public.ems_community_posts (
    post_type, title, summary, content, author_id, anonymous_label, category_id
  ) VALUES (
    'bamboo',
    v_title,
    NULLIF(TRIM(v_summary), ''),
    v_content,
    v_uid,
    COALESCE(v_label, '회원'),
    v_category_id
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_community_bamboo_post(TEXT, TEXT, UUID, TEXT, TEXT) TO authenticated;

-- 답변(댓글): 구급대원·관리자만
CREATE OR REPLACE FUNCTION public.create_post_comment(
  p_post_id UUID,
  p_content TEXT,
  p_parent_id UUID DEFAULT NULL,
  p_anonymous_label TEXT DEFAULT '익명'
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
  IF NOT public.can_write_community_answer() THEN
    RAISE EXCEPTION 'not_authorized_answer';
  END IF;
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

  INSERT INTO public.ems_community_comments (
    post_id, parent_id, author_id, anonymous_label, content
  ) VALUES (
    p_post_id, p_parent_id, v_uid, COALESCE(v_label, '익명'), v_content
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

NOTIFY pgrst, 'reload schema';
