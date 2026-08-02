-- 생활 응급처치 가이드(kemi_posts) 좋아요·댓글
-- 선행: migration_v21 (kemi_posts), migration_v34 (가이드 통합)

ALTER TABLE public.kemi_posts
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0);

-- ============================================================
-- 1) 좋아요
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemi_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.kemi_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kemi_post_likes_post ON public.kemi_post_likes (post_id);

ALTER TABLE public.kemi_post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemi_post_likes_own_read" ON public.kemi_post_likes;
CREATE POLICY "kemi_post_likes_own_read"
  ON public.kemi_post_likes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 2) 댓글
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemi_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.kemi_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_label TEXT NOT NULL DEFAULT '회원',
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemi_post_comments_post_created
  ON public.kemi_post_comments (post_id, created_at ASC);

ALTER TABLE public.kemi_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemi_post_comments_public_read" ON public.kemi_post_comments;
CREATE POLICY "kemi_post_comments_public_read"
  ON public.kemi_post_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.kemi_posts p
      WHERE p.id = post_id AND p.is_published = true
    )
  );

DROP POLICY IF EXISTS "kemi_post_comments_admin_all" ON public.kemi_post_comments;
CREATE POLICY "kemi_post_comments_admin_all"
  ON public.kemi_post_comments
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 댓글 수 동기화
CREATE OR REPLACE FUNCTION public.sync_kemi_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.kemi_posts
    SET comment_count = comment_count + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.kemi_posts
    SET comment_count = GREATEST(comment_count - 1, 0),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_kemi_post_comment_count ON public.kemi_post_comments;
CREATE TRIGGER trg_sync_kemi_post_comment_count
  AFTER INSERT OR DELETE ON public.kemi_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_kemi_post_comment_count();

-- ============================================================
-- 3) RPC — 참여(좋아요·댓글 수)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_kemi_post_engagement(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_like_count INTEGER;
  v_comment_count INTEGER;
  v_liked BOOLEAN := false;
BEGIN
  SELECT like_count, comment_count
  INTO v_like_count, v_comment_count
  FROM public.kemi_posts
  WHERE id = p_post_id AND is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.kemi_post_likes
      WHERE post_id = p_post_id AND user_id = auth.uid()
    ) INTO v_liked;
  END IF;

  RETURN jsonb_build_object(
    'like_count', COALESCE(v_like_count, 0),
    'comment_count', COALESCE(v_comment_count, 0),
    'liked', v_liked
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_kemi_post_engagement(UUID) TO anon, authenticated;

-- 좋아요 토글
CREATE OR REPLACE FUNCTION public.toggle_kemi_post_like(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_like_count INTEGER;
  v_liked BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.kemi_posts p
    WHERE p.id = p_post_id AND p.is_published = true
  ) THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.kemi_post_likes
    WHERE post_id = p_post_id AND user_id = v_uid
  ) THEN
    DELETE FROM public.kemi_post_likes
    WHERE post_id = p_post_id AND user_id = v_uid;

    UPDATE public.kemi_posts
    SET like_count = GREATEST(like_count - 1, 0),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_post_id;

    v_liked := false;
  ELSE
    INSERT INTO public.kemi_post_likes (post_id, user_id)
    VALUES (p_post_id, v_uid);

    UPDATE public.kemi_posts
    SET like_count = like_count + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_post_id;

    v_liked := true;
  END IF;

  SELECT like_count INTO v_like_count
  FROM public.kemi_posts WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'like_count', COALESCE(v_like_count, 0),
    'liked', v_liked
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_kemi_post_like(UUID) TO authenticated;

-- 댓글 목록
CREATE OR REPLACE FUNCTION public.list_kemi_post_comments(p_post_id UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  author_id UUID,
  author_label TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.id,
    c.post_id,
    c.author_id,
    c.author_label,
    c.content,
    c.created_at
  FROM public.kemi_post_comments c
  JOIN public.kemi_posts p ON p.id = c.post_id
  WHERE c.post_id = p_post_id AND p.is_published = true
  ORDER BY c.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_kemi_post_comments(UUID) TO anon, authenticated;

-- 댓글 작성
CREATE OR REPLACE FUNCTION public.create_kemi_post_comment(
  p_post_id UUID,
  p_content TEXT,
  p_author_label TEXT DEFAULT '회원'
)
RETURNS public.kemi_post_comments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_content TEXT := TRIM(p_content);
  v_label TEXT := NULLIF(TRIM(p_author_label), '');
  v_row public.kemi_post_comments;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF LENGTH(v_content) < 1 THEN
    RAISE EXCEPTION 'content_too_short';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.kemi_posts p
    WHERE p.id = p_post_id AND p.is_published = true
  ) THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  INSERT INTO public.kemi_post_comments (post_id, author_id, author_label, content)
  VALUES (p_post_id, v_uid, COALESCE(v_label, '회원'), v_content)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_kemi_post_comment(UUID, TEXT, TEXT) TO authenticated;

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.kemi_post_comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.kemi_post_likes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
