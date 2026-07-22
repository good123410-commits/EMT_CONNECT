-- KEMIX 자유게시판: 댓글/대댓글, 좋아요·싫어요, 신고, 일간 베스트
-- migration_v41 이후 SQL Editor에서 실행

ALTER TABLE public.ems_community_posts
  ADD COLUMN IF NOT EXISTS dislikes INTEGER NOT NULL DEFAULT 0 CHECK (dislikes >= 0),
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0);

-- 게시글 반응 (사용자당 1개: like | dislike)
CREATE TABLE IF NOT EXISTS public.ems_community_post_reactions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.ems_community_posts(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_ems_post_reactions_post
  ON public.ems_community_post_reactions (post_id);

-- 댓글 / 대댓글 (최대 2단계)
CREATE TABLE IF NOT EXISTS public.ems_community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.ems_community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.ems_community_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_label TEXT NOT NULL DEFAULT '익명',
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
  dislikes INTEGER NOT NULL DEFAULT 0 CHECK (dislikes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_ems_comments_post_created
  ON public.ems_community_comments (post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ems_comments_parent
  ON public.ems_community_comments (parent_id)
  WHERE parent_id IS NOT NULL;

-- 댓글 반응
CREATE TABLE IF NOT EXISTS public.ems_community_comment_reactions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.ems_community_comments(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_ems_comment_reactions_comment
  ON public.ems_community_comment_reactions (comment_id);

-- 신고
CREATE TABLE IF NOT EXISTS public.kemix_community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  preview TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_reports_target
  ON public.kemix_community_reports (target_type, target_id);

-- RLS
ALTER TABLE public.ems_community_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ems_community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ems_community_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kemix_community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ems_post_reactions_own" ON public.ems_community_post_reactions;
CREATE POLICY "ems_post_reactions_own"
  ON public.ems_community_post_reactions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ems_comments_public_read" ON public.ems_community_comments;
CREATE POLICY "ems_comments_public_read"
  ON public.ems_community_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "ems_comments_auth_insert" ON public.ems_community_comments;
CREATE POLICY "ems_comments_auth_insert"
  ON public.ems_community_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "ems_comment_reactions_own" ON public.ems_community_comment_reactions;
CREATE POLICY "ems_comment_reactions_own"
  ON public.ems_community_comment_reactions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "kemix_reports_insert_own" ON public.kemix_community_reports;
CREATE POLICY "kemix_reports_insert_own"
  ON public.kemix_community_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "kemix_reports_admin_read" ON public.kemix_community_reports;
CREATE POLICY "kemix_reports_admin_read"
  ON public.kemix_community_reports FOR SELECT TO authenticated
  USING (public.is_approved_admin());

-- 댓글 수 동기화
CREATE OR REPLACE FUNCTION public.sync_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ems_community_posts
    SET comment_count = comment_count + 1, updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ems_community_posts
    SET comment_count = GREATEST(comment_count - 1, 0), updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_comment_count ON public.ems_community_comments;
CREATE TRIGGER trg_sync_post_comment_count
  AFTER INSERT OR DELETE ON public.ems_community_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();

-- 게시글 반응 토글
CREATE OR REPLACE FUNCTION public.toggle_ems_post_reaction(
  p_post_id UUID,
  p_reaction TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_reaction TEXT := TRIM(p_reaction);
  v_existing TEXT;
  v_likes INT;
  v_dislikes INT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF v_reaction NOT IN ('like', 'dislike') THEN RAISE EXCEPTION 'invalid_reaction'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ems_community_posts p
    WHERE p.id = p_post_id AND p.is_hidden = false
  ) THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  SELECT reaction INTO v_existing
  FROM public.ems_community_post_reactions
  WHERE user_id = v_uid AND post_id = p_post_id;

  IF v_existing = v_reaction THEN
    DELETE FROM public.ems_community_post_reactions
    WHERE user_id = v_uid AND post_id = p_post_id;
    IF v_reaction = 'like' THEN
      UPDATE public.ems_community_posts SET likes = GREATEST(likes - 1, 0) WHERE id = p_post_id;
    ELSE
      UPDATE public.ems_community_posts SET dislikes = GREATEST(dislikes - 1, 0) WHERE id = p_post_id;
    END IF;
    v_existing := NULL;
  ELSIF v_existing IS NOT NULL THEN
    UPDATE public.ems_community_post_reactions
    SET reaction = v_reaction, created_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = v_uid AND post_id = p_post_id;
    IF v_reaction = 'like' THEN
      UPDATE public.ems_community_posts
      SET likes = likes + 1, dislikes = GREATEST(dislikes - 1, 0)
      WHERE id = p_post_id;
    ELSE
      UPDATE public.ems_community_posts
      SET dislikes = dislikes + 1, likes = GREATEST(likes - 1, 0)
      WHERE id = p_post_id;
    END IF;
    v_existing := v_reaction;
  ELSE
    INSERT INTO public.ems_community_post_reactions (user_id, post_id, reaction)
    VALUES (v_uid, p_post_id, v_reaction);
    IF v_reaction = 'like' THEN
      UPDATE public.ems_community_posts SET likes = likes + 1 WHERE id = p_post_id;
    ELSE
      UPDATE public.ems_community_posts SET dislikes = dislikes + 1 WHERE id = p_post_id;
    END IF;
    v_existing := v_reaction;
  END IF;

  SELECT likes, dislikes INTO v_likes, v_dislikes
  FROM public.ems_community_posts WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'likes', v_likes,
    'dislikes', v_dislikes,
    'my_reaction', v_existing
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_ems_post_reaction(UUID, TEXT) TO authenticated;

-- 내 게시글 반응 조회
CREATE OR REPLACE FUNCTION public.get_my_post_reaction(p_post_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT reaction FROM public.ems_community_post_reactions
  WHERE user_id = auth.uid() AND post_id = p_post_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_post_reaction(UUID) TO authenticated;

-- 댓글 반응 토글
CREATE OR REPLACE FUNCTION public.toggle_ems_comment_reaction(
  p_comment_id UUID,
  p_reaction TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_reaction TEXT := TRIM(p_reaction);
  v_existing TEXT;
  v_likes INT;
  v_dislikes INT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF v_reaction NOT IN ('like', 'dislike') THEN RAISE EXCEPTION 'invalid_reaction'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.ems_community_comments c WHERE c.id = p_comment_id) THEN
    RAISE EXCEPTION 'comment_not_found';
  END IF;

  SELECT reaction INTO v_existing
  FROM public.ems_community_comment_reactions
  WHERE user_id = v_uid AND comment_id = p_comment_id;

  IF v_existing = v_reaction THEN
    DELETE FROM public.ems_community_comment_reactions
    WHERE user_id = v_uid AND comment_id = p_comment_id;
    IF v_reaction = 'like' THEN
      UPDATE public.ems_community_comments SET likes = GREATEST(likes - 1, 0) WHERE id = p_comment_id;
    ELSE
      UPDATE public.ems_community_comments SET dislikes = GREATEST(dislikes - 1, 0) WHERE id = p_comment_id;
    END IF;
    v_existing := NULL;
  ELSIF v_existing IS NOT NULL THEN
    UPDATE public.ems_community_comment_reactions
    SET reaction = v_reaction, created_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = v_uid AND comment_id = p_comment_id;
    IF v_reaction = 'like' THEN
      UPDATE public.ems_community_comments
      SET likes = likes + 1, dislikes = GREATEST(dislikes - 1, 0)
      WHERE id = p_comment_id;
    ELSE
      UPDATE public.ems_community_comments
      SET dislikes = dislikes + 1, likes = GREATEST(likes - 1, 0)
      WHERE id = p_comment_id;
    END IF;
    v_existing := v_reaction;
  ELSE
    INSERT INTO public.ems_community_comment_reactions (user_id, comment_id, reaction)
    VALUES (v_uid, p_comment_id, v_reaction);
    IF v_reaction = 'like' THEN
      UPDATE public.ems_community_comments SET likes = likes + 1 WHERE id = p_comment_id;
    ELSE
      UPDATE public.ems_community_comments SET dislikes = dislikes + 1 WHERE id = p_comment_id;
    END IF;
    v_existing := v_reaction;
  END IF;

  SELECT likes, dislikes INTO v_likes, v_dislikes
  FROM public.ems_community_comments WHERE id = p_comment_id;

  RETURN jsonb_build_object(
    'likes', v_likes,
    'dislikes', v_dislikes,
    'my_reaction', v_existing
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_ems_comment_reaction(UUID, TEXT) TO authenticated;

-- 댓글 목록 (반응 상태 포함)
CREATE OR REPLACE FUNCTION public.list_post_comments(p_post_id UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  parent_id UUID,
  author_id UUID,
  anonymous_label TEXT,
  content TEXT,
  likes INTEGER,
  dislikes INTEGER,
  created_at TIMESTAMPTZ,
  my_reaction TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.id,
    c.post_id,
    c.parent_id,
    c.author_id,
    c.anonymous_label,
    c.content,
    c.likes,
    c.dislikes,
    c.created_at,
    r.reaction AS my_reaction
  FROM public.ems_community_comments c
  LEFT JOIN public.ems_community_comment_reactions r
    ON r.comment_id = c.id AND r.user_id = auth.uid()
  WHERE c.post_id = p_post_id
  ORDER BY c.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_post_comments(UUID) TO anon, authenticated;

-- 댓글 작성 (대댓글: parent는 최상위 댓글만)
CREATE OR REPLACE FUNCTION public.create_post_comment(
  p_post_id UUID,
  p_content TEXT,
  p_parent_id UUID DEFAULT NULL,
  p_anonymous_label TEXT DEFAULT '익명'
)
RETURNS public.ems_community_comments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

  INSERT INTO public.ems_community_comments (
    post_id, parent_id, author_id, anonymous_label, content
  ) VALUES (
    p_post_id, p_parent_id, v_uid, COALESCE(v_label, '익명'), v_content
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_post_comment(UUID, TEXT, UUID, TEXT) TO authenticated;

-- 신고 접수
CREATE OR REPLACE FUNCTION public.submit_community_report(
  p_target_type TEXT,
  p_target_id UUID,
  p_reason TEXT,
  p_preview TEXT DEFAULT NULL
)
RETURNS public.kemix_community_reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_type TEXT := TRIM(p_target_type);
  v_reason TEXT := TRIM(p_reason);
  v_row public.kemix_community_reports;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF v_type NOT IN ('post', 'comment') THEN RAISE EXCEPTION 'invalid_target_type'; END IF;
  IF LENGTH(v_reason) < 2 THEN RAISE EXCEPTION 'reason_too_short'; END IF;

  INSERT INTO public.kemix_community_reports (
    reporter_id, target_type, target_id, reason, preview
  ) VALUES (
    v_uid, v_type, p_target_id, v_reason, NULLIF(TRIM(p_preview), '')
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_community_report(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- 일간 베스트 (최근 24시간 좋아요 상위)
CREATE OR REPLACE FUNCTION public.list_daily_best_posts(p_limit INTEGER DEFAULT 10)
RETURNS SETOF public.ems_community_posts
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.ems_community_posts
  WHERE post_type = 'bamboo'
    AND is_hidden = false
    AND created_at >= TIMEZONE('utc'::text, NOW()) - INTERVAL '24 hours'
  ORDER BY likes DESC, created_at DESC
  LIMIT GREATEST(LEAST(p_limit, 20), 1);
$$;

GRANT EXECUTE ON FUNCTION public.list_daily_best_posts(INTEGER) TO anon, authenticated;

-- 페이지네이션 목록
CREATE OR REPLACE FUNCTION public.list_bamboo_posts_page(
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 15,
  p_category_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  post_type TEXT,
  title TEXT,
  summary TEXT,
  content TEXT,
  anonymous_label TEXT,
  likes INTEGER,
  dislikes INTEGER,
  is_hot BOOLEAN,
  author_id UUID,
  created_at TIMESTAMPTZ,
  is_hidden BOOLEAN,
  is_notice BOOLEAN,
  category_id UUID,
  comment_count INTEGER,
  category_slug TEXT,
  category_name TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_page INT := GREATEST(COALESCE(p_page, 1), 1);
  v_size INT := GREATEST(LEAST(COALESCE(p_page_size, 15), 50), 1);
  v_offset INT := (v_page - 1) * v_size;
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT
      p.*,
      c.slug AS cat_slug,
      c.name AS cat_name
    FROM public.ems_community_posts p
    LEFT JOIN public.kemix_community_categories c ON c.id = p.category_id
    WHERE p.post_type = 'bamboo'
      AND p.is_hidden = false
      AND (
        p_category_slug IS NULL OR TRIM(p_category_slug) = ''
        OR c.slug = TRIM(p_category_slug)
      )
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS cnt FROM filtered
  )
  SELECT
    f.id,
    f.post_type,
    f.title,
    f.summary,
    f.content,
    f.anonymous_label,
    f.likes,
    f.dislikes,
    f.is_hot,
    f.author_id,
    f.created_at,
    f.is_hidden,
    COALESCE(f.is_notice, false),
    f.category_id,
    COALESCE(f.comment_count, 0),
    f.cat_slug,
    f.cat_name,
    counted.cnt
  FROM filtered f
  CROSS JOIN counted
  ORDER BY COALESCE(f.is_notice, false) DESC, f.created_at DESC
  LIMIT v_size OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_bamboo_posts_page(INTEGER, INTEGER, TEXT) TO anon, authenticated;

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ems_community_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
