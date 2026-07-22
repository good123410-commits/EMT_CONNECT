-- migration_v37_kemix_about_items.sql
-- KEMIX 소개 페이지 개별 항목 CMS (연혁/구성/개발일지)
-- 선행: migration_v33

CREATE TABLE IF NOT EXISTS public.kemix_about_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL
    CHECK (page_slug IN ('history', 'structure', 'dev-log')),
  badge_label TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_about_items_page
  ON public.kemix_about_items (page_slug, is_published, display_order, created_at DESC);

ALTER TABLE public.kemix_about_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_about_items_public_read" ON public.kemix_about_items;
CREATE POLICY "kemix_about_items_public_read"
  ON public.kemix_about_items FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "kemix_about_items_admin_all" ON public.kemix_about_items;
CREATE POLICY "kemix_about_items_admin_all"
  ON public.kemix_about_items FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- Seed (only when empty per page)
INSERT INTO public.kemix_about_items (page_slug, badge_label, title, summary, content, display_order, is_published)
SELECT * FROM (VALUES
  ('history', '2024', 'EMS_Connect 모바일 앱 베타 출시', 'EMS_Connect 모바일 앱 베타 출시', '<p>응급의료 현장을 위한 모바일 앱 베타 서비스를 시작했습니다.</p>', 0, true),
  ('history', '2025', '실시간 응급실·병원 찾기 서비스 정식 오픈', '실시간 응급실·병원 찾기 서비스 정식 오픈', '<p>공공 데이터 기반 실시간 응급실·병원 찾기 기능을 정식 오픈했습니다.</p>', 1, true),
  ('history', '2025', '구급대원 커뮤니티 및 Q&A 시스템 구축', '구급대원 커뮤니티 및 Q&A 시스템 구축', '<p>현장 구급대원을 위한 커뮤니티와 Q&A 시스템을 구축했습니다.</p>', 2, true),
  ('history', '2026', 'KEMIX 브랜드 리뉴얼 및 공식 웹 플랫폼 런칭', 'KEMIX(케믹스) 브랜드 리뉴얼 및 공식 웹 플랫폼 런칭', '<p>KEMI에서 KEMIX로 리브랜딩하고 공식 웹 플랫폼을 런칭했습니다.</p>', 3, true),
  ('structure', NULL, '플랫폼 개발팀', '웹·모바일 앱, Supabase 백엔드, 실시간 데이터 연동', '<p>웹·모바일 앱, Supabase 백엔드, 실시간 데이터 연동을 담당합니다.</p>', 0, true),
  ('structure', NULL, '콘텐츠·편집팀', '생활 응급처치 가이드, 이달의 인터뷰, SEO 콘텐츠', '<p>생활 응급처치 가이드, 이달의 인터뷰, SEO 콘텐츠를 제작합니다.</p>', 1, true),
  ('structure', NULL, 'EMS 커뮤니티팀', '구급대원 커뮤니티 운영, 모금·후원 관리', '<p>구급대원 커뮤니티 운영과 모금·후원 관리를 담당합니다.</p>', 2, true),
  ('structure', NULL, '의료 자문단', '응급의료 전문가 자문, 프로토콜 검수', '<p>응급의료 전문가 자문과 프로토콜 검수를 수행합니다.</p>', 3, true),
  ('dev-log', '2026-07', 'KEMIX 웹 플랫폼 v2.0', '오프닝 몽타주, GNB 개편, 모금 계좌 관리 시스템 구축', '<p>오프닝 몽타주, GNB 개편, 모금 계좌 관리 시스템을 구축했습니다.</p>', 0, true),
  ('dev-log', '2026-06', '실시간 통계 바 연동', '병원·가이드·구급대원 수 Supabase RPC 연동', '<p>병원·가이드·구급대원 수 Supabase RPC 연동을 완료했습니다.</p>', 1, true),
  ('dev-log', '2026-05', '블로그 실시간 동기화', 'kemi_posts Realtime으로 웹·앱 콘텐츠 공유', '<p>kemi_posts Realtime으로 웹·앱 콘텐츠를 공유합니다.</p>', 2, true),
  ('dev-log', '2026-04', 'KEMIX 브랜드 런칭', 'KEMI에서 KEMIX로 리브랜딩', '<p>KEMI에서 KEMIX로 리브랜딩을 진행했습니다.</p>', 3, true)
) AS seed(page_slug, badge_label, title, summary, content, display_order, is_published)
WHERE NOT EXISTS (
  SELECT 1 FROM public.kemix_about_items i WHERE i.page_slug = seed.page_slug
);

CREATE OR REPLACE FUNCTION public.list_published_about_items(p_page_slug TEXT)
RETURNS SETOF public.kemix_about_items
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.kemix_about_items
  WHERE page_slug = TRIM(p_page_slug)
    AND is_published = true
  ORDER BY display_order ASC, created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_published_about_items(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_about_items(p_page_slug TEXT DEFAULT NULL)
RETURNS SETOF public.kemix_about_items
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.kemix_about_items
  WHERE p_page_slug IS NULL OR TRIM(p_page_slug) = '' OR page_slug = TRIM(p_page_slug)
  ORDER BY page_slug ASC, display_order ASC, created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_about_items(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_about_item(
  p_id UUID DEFAULT NULL,
  p_page_slug TEXT DEFAULT NULL,
  p_badge_label TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_summary TEXT DEFAULT '',
  p_content TEXT DEFAULT '',
  p_display_order INTEGER DEFAULT 0,
  p_is_published BOOLEAN DEFAULT true
)
RETURNS public.kemix_about_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_about_items;
  v_slug TEXT := TRIM(p_page_slug);
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF v_slug IS NULL OR v_slug = '' OR TRIM(COALESCE(p_title, '')) = '' THEN
    RAISE EXCEPTION 'required_fields_missing';
  END IF;

  IF v_slug NOT IN ('history', 'structure', 'dev-log') THEN
    RAISE EXCEPTION 'invalid_page_slug';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_about_items (
      page_slug, badge_label, title, summary, content, display_order, is_published
    ) VALUES (
      v_slug,
      NULLIF(TRIM(p_badge_label), ''),
      TRIM(p_title),
      COALESCE(p_summary, ''),
      COALESCE(p_content, ''),
      COALESCE(p_display_order, 0),
      COALESCE(p_is_published, true)
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_about_items
    SET
      page_slug = v_slug,
      badge_label = NULLIF(TRIM(p_badge_label), ''),
      title = TRIM(p_title),
      summary = COALESCE(p_summary, ''),
      content = COALESCE(p_content, ''),
      display_order = COALESCE(p_display_order, 0),
      is_published = COALESCE(p_is_published, true),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'item_not_found';
    END IF;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_about_item(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_about_item(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.kemix_about_items WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'item_not_found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_about_item(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
