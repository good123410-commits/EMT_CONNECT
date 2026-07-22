-- KEMIX 관리자 플랫폼 확장: 인터뷰 대표 설정, 가이드 카테고리, 커뮤니티 카테고리, 스킬 트리
-- 선행: migration_v23, migration_v21, migration_v5

-- ============================================================
-- 1) 인터뷰 — 대표(메인 노출) 플래그
-- ============================================================
ALTER TABLE public.kemix_monthly_interviews
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_featured_interview()
RETURNS public.kemix_monthly_interviews
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_monthly_interviews
  WHERE is_published = true
  ORDER BY is_featured DESC, published_month DESC, created_at DESC
  LIMIT 1;
$$;

-- ============================================================
-- 2) 가이드(kemi_posts) — 카테고리·요약
-- ============================================================
ALTER TABLE public.kemi_posts
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS summary TEXT;

CREATE OR REPLACE FUNCTION public.admin_upsert_kemi_post(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_slug TEXT DEFAULT '',
  p_content TEXT DEFAULT '',
  p_thumbnail_url TEXT DEFAULT NULL,
  p_is_published BOOLEAN DEFAULT false,
  p_seo_title TEXT DEFAULT NULL,
  p_seo_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'general',
  p_summary TEXT DEFAULT NULL
)
RETURNS public.kemi_posts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemi_posts;
  v_slug TEXT := LOWER(REGEXP_REPLACE(TRIM(p_slug), '\s+', '-', 'g'));
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not_authorized_admin'; END IF;
  IF TRIM(p_title) = '' OR v_slug = '' THEN RAISE EXCEPTION 'required_fields_missing'; END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemi_posts (
      title, slug, content, thumbnail_url, is_published, seo_title, seo_description, category, summary
    ) VALUES (
      TRIM(p_title), v_slug, COALESCE(p_content, ''), NULLIF(TRIM(p_thumbnail_url), ''),
      COALESCE(p_is_published, false), NULLIF(TRIM(p_seo_title), ''), NULLIF(TRIM(p_seo_description), ''),
      COALESCE(NULLIF(TRIM(p_category), ''), 'general'), NULLIF(TRIM(p_summary), '')
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemi_posts SET
      title = TRIM(p_title), slug = v_slug, content = COALESCE(p_content, content),
      thumbnail_url = NULLIF(TRIM(p_thumbnail_url), ''), is_published = COALESCE(p_is_published, is_published),
      seo_title = NULLIF(TRIM(p_seo_title), ''), seo_description = NULLIF(TRIM(p_seo_description), ''),
      category = COALESCE(NULLIF(TRIM(p_category), ''), category),
      summary = COALESCE(NULLIF(TRIM(p_summary), ''), summary),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id RETURNING * INTO v_row;
    IF v_row.id IS NULL THEN RAISE EXCEPTION 'kemi_post_not_found'; END IF;
  END IF;
  RETURN v_row;
END;
$$;

-- ============================================================
-- 3) 커뮤니티 카테고리
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_community_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.ems_community_posts
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.kemix_community_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_notice BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.kemix_community_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_community_categories_public_read" ON public.kemix_community_categories;
CREATE POLICY "kemix_community_categories_public_read"
  ON public.kemix_community_categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "kemix_community_categories_admin_all" ON public.kemix_community_categories;
CREATE POLICY "kemix_community_categories_admin_all"
  ON public.kemix_community_categories FOR ALL
  USING (public.is_approved_admin()) WITH CHECK (public.is_approved_admin());

INSERT INTO public.kemix_community_categories (name, slug, display_order)
SELECT * FROM (VALUES
  ('자유', 'free', 1), ('질문', 'question', 2), ('정보', 'info', 3), ('현장 이야기', 'field', 4)
) AS v(name, slug, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.kemix_community_categories LIMIT 1);

-- ============================================================
-- 4) 스킬 테크 트리
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_skill_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'foundation'
    CHECK (level IN ('foundation', 'intermediate', 'advanced', 'expert')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  prerequisites TEXT[] NOT NULL DEFAULT '{}'::text[],
  recommended_courses TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.kemix_skill_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_skill_nodes_public_read" ON public.kemix_skill_nodes;
CREATE POLICY "kemix_skill_nodes_public_read"
  ON public.kemix_skill_nodes FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "kemix_skill_nodes_admin_all" ON public.kemix_skill_nodes;
CREATE POLICY "kemix_skill_nodes_admin_all"
  ON public.kemix_skill_nodes FOR ALL
  USING (public.is_approved_admin()) WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 5) 인터뷰 관리 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_interviews()
RETURNS SETOF public.kemix_monthly_interviews
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY SELECT * FROM public.kemix_monthly_interviews ORDER BY published_month DESC, created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_interview(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_interviewee_name TEXT DEFAULT '',
  p_interviewee_role TEXT DEFAULT NULL,
  p_excerpt TEXT DEFAULT NULL,
  p_content TEXT DEFAULT '',
  p_thumbnail_url TEXT DEFAULT NULL,
  p_published_month TEXT DEFAULT '',
  p_is_published BOOLEAN DEFAULT false,
  p_is_featured BOOLEAN DEFAULT false
)
RETURNS public.kemix_monthly_interviews
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.kemix_monthly_interviews;
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF TRIM(p_title) = '' OR TRIM(p_interviewee_name) = '' OR TRIM(p_published_month) = '' THEN
    RAISE EXCEPTION 'required_fields_missing';
  END IF;
  IF COALESCE(p_is_featured, false) THEN
    UPDATE public.kemix_monthly_interviews SET is_featured = false WHERE is_featured = true;
  END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.kemix_monthly_interviews (
      title, interviewee_name, interviewee_role, excerpt, content, thumbnail_url,
      published_month, is_published, is_featured
    ) VALUES (
      TRIM(p_title), TRIM(p_interviewee_name), NULLIF(TRIM(p_interviewee_role), ''),
      NULLIF(TRIM(p_excerpt), ''), COALESCE(p_content, ''), NULLIF(TRIM(p_thumbnail_url), ''),
      TRIM(p_published_month), COALESCE(p_is_published, false), COALESCE(p_is_featured, false)
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_monthly_interviews SET
      title = TRIM(p_title), interviewee_name = TRIM(p_interviewee_name),
      interviewee_role = NULLIF(TRIM(p_interviewee_role), ''), excerpt = NULLIF(TRIM(p_excerpt), ''),
      content = COALESCE(p_content, content), thumbnail_url = NULLIF(TRIM(p_thumbnail_url), ''),
      published_month = TRIM(p_published_month), is_published = COALESCE(p_is_published, is_published),
      is_featured = COALESCE(p_is_featured, is_featured), updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_interview(p_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  DELETE FROM public.kemix_monthly_interviews WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- 6) FAQ 관리 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_faqs()
RETURNS SETOF public.kemix_faqs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY SELECT * FROM public.kemix_faqs ORDER BY display_order ASC, created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_faq(
  p_id UUID DEFAULT NULL, p_question TEXT DEFAULT '', p_answer TEXT DEFAULT '',
  p_category TEXT DEFAULT 'general', p_display_order INTEGER DEFAULT 0, p_is_published BOOLEAN DEFAULT true
)
RETURNS public.kemix_faqs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.kemix_faqs;
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF TRIM(p_question) = '' OR TRIM(p_answer) = '' THEN RAISE EXCEPTION 'required_fields_missing'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.kemix_faqs (question, answer, category, display_order, is_published)
    VALUES (TRIM(p_question), TRIM(p_answer), COALESCE(NULLIF(TRIM(p_category),''),'general'),
      COALESCE(p_display_order,0), COALESCE(p_is_published,true)) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_faqs SET question = TRIM(p_question), answer = TRIM(p_answer),
      category = COALESCE(NULLIF(TRIM(p_category),''), category), display_order = COALESCE(p_display_order, display_order),
      is_published = COALESCE(p_is_published, is_published) WHERE id = p_id RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_faq(p_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  DELETE FROM public.kemix_faqs WHERE id = p_id; RETURN FOUND;
END;
$$;

-- ============================================================
-- 7) 스킬 노드 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_skill_nodes()
RETURNS SETOF public.kemix_skill_nodes
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.kemix_skill_nodes WHERE is_published = true ORDER BY display_order ASC, created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_published_skill_nodes() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_skill_nodes()
RETURNS SETOF public.kemix_skill_nodes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY SELECT * FROM public.kemix_skill_nodes ORDER BY display_order ASC, created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_skill_node(
  p_id UUID DEFAULT NULL, p_level TEXT DEFAULT 'foundation', p_title TEXT DEFAULT '',
  p_description TEXT DEFAULT '', p_prerequisites TEXT[] DEFAULT '{}'::text[],
  p_recommended_courses TEXT DEFAULT '', p_display_order INTEGER DEFAULT 0, p_is_published BOOLEAN DEFAULT true
)
RETURNS public.kemix_skill_nodes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.kemix_skill_nodes;
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF TRIM(p_title) = '' THEN RAISE EXCEPTION 'required_fields_missing'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.kemix_skill_nodes (level, title, description, prerequisites, recommended_courses, display_order, is_published)
    VALUES (COALESCE(NULLIF(TRIM(p_level),''),'foundation'), TRIM(p_title), COALESCE(p_description,''),
      COALESCE(p_prerequisites,'{}'::text[]), COALESCE(p_recommended_courses,''), COALESCE(p_display_order,0), COALESCE(p_is_published,true))
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_skill_nodes SET level = COALESCE(NULLIF(TRIM(p_level),''), level), title = TRIM(p_title),
      description = COALESCE(p_description, description), prerequisites = COALESCE(p_prerequisites, prerequisites),
      recommended_courses = COALESCE(p_recommended_courses, recommended_courses),
      display_order = COALESCE(p_display_order, display_order), is_published = COALESCE(p_is_published, is_published),
      updated_at = TIMEZONE('utc'::text, NOW()) WHERE id = p_id RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_skill_node(p_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  DELETE FROM public.kemix_skill_nodes WHERE id = p_id; RETURN FOUND;
END;
$$;

-- ============================================================
-- 8) 커뮤니티 카테고리 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_active_community_categories()
RETURNS SETOF public.kemix_community_categories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.kemix_community_categories WHERE is_active = true ORDER BY display_order ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_active_community_categories() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_community_categories()
RETURNS SETOF public.kemix_community_categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY SELECT * FROM public.kemix_community_categories ORDER BY display_order ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_community_category(
  p_id UUID DEFAULT NULL, p_name TEXT DEFAULT '', p_slug TEXT DEFAULT '',
  p_display_order INTEGER DEFAULT 0, p_is_active BOOLEAN DEFAULT true
)
RETURNS public.kemix_community_categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.kemix_community_categories;
  v_slug TEXT := LOWER(REGEXP_REPLACE(TRIM(p_slug), '\s+', '-', 'g'));
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF TRIM(p_name) = '' OR v_slug = '' THEN RAISE EXCEPTION 'required_fields_missing'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.kemix_community_categories (name, slug, display_order, is_active)
    VALUES (TRIM(p_name), v_slug, COALESCE(p_display_order,0), COALESCE(p_is_active,true)) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_community_categories SET name = TRIM(p_name), slug = v_slug,
      display_order = COALESCE(p_display_order, display_order), is_active = COALESCE(p_is_active, is_active)
    WHERE id = p_id RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_community_category(p_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  DELETE FROM public.kemix_community_categories WHERE id = p_id; RETURN FOUND;
END;
$$;

NOTIFY pgrst, 'reload schema';
