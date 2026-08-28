-- 작성자 수정/삭제 + 질문함 비밀글
-- 선행: migration_v47_qa_board_rbac.sql

ALTER TABLE public.ems_community_posts
  ADD COLUMN IF NOT EXISTS is_secret BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ems_community_posts_is_secret
  ON public.ems_community_posts (is_secret)
  WHERE is_secret = true;

DROP POLICY IF EXISTS "ems_community_posts_auth_delete_own" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_auth_delete_own"
  ON public.ems_community_posts
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

DROP FUNCTION IF EXISTS public.create_community_bamboo_post(TEXT, TEXT, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_community_bamboo_post(
  p_title TEXT,
  p_content TEXT,
  p_category_id UUID DEFAULT NULL,
  p_category_slug TEXT DEFAULT 'question',
  p_anonymous_label TEXT DEFAULT '회원',
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

  INSERT INTO public.ems_community_posts (
    post_type, title, summary, content, author_id, anonymous_label, category_id, is_secret
  ) VALUES (
    'bamboo',
    v_title,
    NULLIF(TRIM(v_summary), ''),
    v_content,
    v_uid,
    COALESCE(v_label, '회원'),
    v_category_id,
    COALESCE(p_is_secret, false)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_community_bamboo_post(TEXT, TEXT, UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
