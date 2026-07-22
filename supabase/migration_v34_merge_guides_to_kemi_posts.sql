-- migration_v34_merge_guides_to_kemi_posts.sql
-- 응급 매뉴얼(emergency_guides) → 생활 응급처치(kemi_posts) 통합
-- 선행: migration_v21, migration_v24, migration_v25, emergency_guides.sql

-- ============================================================
-- 1) 공개 목록 RPC — category·summary 포함
-- ============================================================
DROP FUNCTION IF EXISTS public.list_published_kemi_posts(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.list_published_kemi_posts(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  thumbnail_url TEXT,
  views INTEGER,
  seo_title TEXT,
  seo_description TEXT,
  category TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.slug,
    p.thumbnail_url,
    p.views,
    p.seo_title,
    p.seo_description,
    p.category,
    p.summary,
    p.created_at,
    p.updated_at
  FROM public.kemi_posts p
  WHERE p.is_published = true
  ORDER BY p.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
$$;

GRANT EXECUTE ON FUNCTION public.list_published_kemi_posts(INTEGER, INTEGER) TO anon, authenticated;

-- ============================================================
-- 2) emergency_guides → kemi_posts 데이터 이전 (중복 제목 스킵)
-- ============================================================
INSERT INTO public.kemi_posts (
  title,
  slug,
  content,
  category,
  summary,
  is_published,
  created_at,
  updated_at
)
SELECT
  eg.title,
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(TRIM(eg.title), '\s+', '-', 'g'),
      '[^a-z0-9가-힣-]', '', 'g'
    )
  ) || '-eg-' || SUBSTRING(eg.id::text, 1, 8),
  COALESCE(eg.content, ''),
  COALESCE(NULLIF(TRIM(eg.category), ''), '기타'),
  LEFT(REGEXP_REPLACE(COALESCE(eg.content, ''), '<[^>]+>', '', 'g'), 160),
  true,
  COALESCE(eg.created_at, TIMEZONE('utc'::text, NOW())),
  TIMEZONE('utc'::text, NOW())
FROM public.emergency_guides eg
WHERE NOT EXISTS (
  SELECT 1 FROM public.kemi_posts kp
  WHERE LOWER(TRIM(kp.title)) = LOWER(TRIM(eg.title))
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3) kemi_posts — 앱 가이드 관리자(인증 사용자) CRUD 정책
-- ============================================================
DROP POLICY IF EXISTS "kemi_posts_authenticated_insert" ON public.kemi_posts;
CREATE POLICY "kemi_posts_authenticated_insert"
  ON public.kemi_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "kemi_posts_authenticated_update" ON public.kemi_posts;
CREATE POLICY "kemi_posts_authenticated_update"
  ON public.kemi_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "kemi_posts_authenticated_delete" ON public.kemi_posts;
CREATE POLICY "kemi_posts_authenticated_delete"
  ON public.kemi_posts FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 4) kemix_post_categories — 앱 분류 관리자 CRUD
-- ============================================================
DROP POLICY IF EXISTS "kemix_post_categories_contributor_insert" ON public.kemix_post_categories;
CREATE POLICY "kemix_post_categories_contributor_insert"
  ON public.kemix_post_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "kemix_post_categories_contributor_delete" ON public.kemix_post_categories;
CREATE POLICY "kemix_post_categories_contributor_delete"
  ON public.kemix_post_categories FOR DELETE
  TO authenticated
  USING (true);

-- guide_categories 분류명을 kemix_post_categories로 동기화 (테이블 있을 때만)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'guide_categories'
  ) THEN
    INSERT INTO public.kemix_post_categories (name, slug, display_order, is_active)
    SELECT gc.name,
           LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(gc.name), '\s+', '-', 'g'), '[^a-z0-9-]', '', 'g')),
           100,
           true
    FROM public.guide_categories gc
    WHERE NOT EXISTS (
      SELECT 1 FROM public.kemix_post_categories kpc
      WHERE kpc.name = gc.name
    )
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Realtime (선택)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'kemix_post_categories'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.kemix_post_categories;
    END IF;
  END IF;
END $$;
