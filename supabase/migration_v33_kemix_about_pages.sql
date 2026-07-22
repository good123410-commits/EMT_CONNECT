-- migration_v33_kemix_about_pages.sql
-- KEMIX 소개 페이지 CMS
-- 선행: migration_v5

CREATE TABLE IF NOT EXISTS public.kemix_about_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  eyebrow TEXT NOT NULL DEFAULT 'About KEMIX',
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.kemix_about_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_about_pages_public_read" ON public.kemix_about_pages;
CREATE POLICY "kemix_about_pages_public_read"
  ON public.kemix_about_pages FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "kemix_about_pages_admin_all" ON public.kemix_about_pages;
CREATE POLICY "kemix_about_pages_admin_all"
  ON public.kemix_about_pages FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

INSERT INTO public.kemix_about_pages (slug, eyebrow, title, subtitle, content, is_published)
VALUES
  ('vision', 'About KEMIX', '케믹스 비전', '대한민국 응급의료의 디지털 혁신을 선도합니다',
   '<h2>우리의 미션</h2><p>KEMIX(케믹스)는 응급의료 현장의 정보 비대칭을 해소하고, 대국민과 응급구조사·의료진을 하나의 플랫폼으로 연결합니다.</p><h2>핵심 가치</h2><ul><li><strong>신뢰</strong> — 공공 데이터와 검증된 전문 콘텐츠 기반</li><li><strong>연결</strong> — 웹·모바일 앱 실시간 동기화</li><li><strong>혁신</strong> — 차세대 EMS 교육 및 표준화 추진</li><li><strong>공익</strong> — 응급의료 접근성 향상을 위한 지속적 투자</li></ul>',
   true),
  ('history', 'About KEMIX', '케믹스 연혁', '응급의료 혁신의 발자취',
   '<div class="timeline"><div class="timeline-item"><span class="timeline-year">2024</span><p class="timeline-event">EMS_Connect 모바일 앱 베타 출시</p></div><div class="timeline-item"><span class="timeline-year">2025</span><p class="timeline-event">실시간 응급실·병원 찾기 서비스 정식 오픈</p></div><div class="timeline-item"><span class="timeline-year">2025</span><p class="timeline-event">구급대원 커뮤니티 및 Q&A 시스템 구축</p></div><div class="timeline-item"><span class="timeline-year">2026</span><p class="timeline-event">KEMIX(케믹스) 브랜드 리뉴얼 및 공식 웹 플랫폼 런칭</p></div></div>',
   true),
  ('structure', 'About KEMIX', '케믹스 구성', '전문성과 협업으로 만드는 응급의료 생태계',
   '<div class="card-grid"><article class="info-card"><h3>플랫폼 개발팀</h3><p>웹·모바일 앱, Supabase 백엔드, 실시간 데이터 연동</p></article><article class="info-card"><h3>콘텐츠·편집팀</h3><p>생활 응급처치 가이드, 이달의 인터뷰, SEO 콘텐츠</p></article><article class="info-card"><h3>EMS 커뮤니티팀</h3><p>구급대원 커뮤니티 운영, 모금·후원 관리</p></article><article class="info-card"><h3>의료 자문단</h3><p>응급의료 전문가 자문, 프로토콜 검수</p></article></div>',
   true),
  ('dev-log', 'About KEMIX', '개발일지', 'KEMIX 플랫폼 업데이트 기록',
   '<div class="dev-log-list"><article class="dev-log-item"><time>2026-07</time><h3>KEMIX 웹 플랫폼 v2.0</h3><p>오프닝 몽타주, GNB 개편, 모금 계좌 관리 시스템 구축</p></article><article class="dev-log-item"><time>2026-06</time><h3>실시간 통계 바 연동</h3><p>병원·가이드·구급대원 수 Supabase RPC 연동</p></article></div>',
   true)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_published_about_page(p_slug TEXT)
RETURNS public.kemix_about_pages
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_about_pages
  WHERE slug = p_slug AND is_published = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_published_about_page(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_about_pages()
RETURNS SETOF public.kemix_about_pages
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY SELECT * FROM public.kemix_about_pages ORDER BY slug ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_about_pages() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_about_page(
  p_slug TEXT,
  p_eyebrow TEXT DEFAULT 'About KEMIX',
  p_title TEXT DEFAULT NULL,
  p_subtitle TEXT DEFAULT NULL,
  p_content TEXT DEFAULT '',
  p_is_published BOOLEAN DEFAULT true
)
RETURNS public.kemix_about_pages
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.kemix_about_pages;
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  INSERT INTO public.kemix_about_pages (slug, eyebrow, title, subtitle, content, is_published)
  VALUES (p_slug, COALESCE(p_eyebrow, 'About KEMIX'), p_title, p_subtitle, COALESCE(p_content, ''), COALESCE(p_is_published, true))
  ON CONFLICT (slug) DO UPDATE SET
    eyebrow = COALESCE(EXCLUDED.eyebrow, kemix_about_pages.eyebrow),
    title = COALESCE(EXCLUDED.title, kemix_about_pages.title),
    subtitle = COALESCE(EXCLUDED.subtitle, kemix_about_pages.subtitle),
    content = COALESCE(EXCLUDED.content, kemix_about_pages.content),
    is_published = COALESCE(EXCLUDED.is_published, kemix_about_pages.is_published),
    updated_at = TIMEZONE('utc'::text, NOW())
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_about_page(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
