-- migration_v38_kemix_platform_stats_visitors.sql
-- 플랫폼 통계 확장: 총 회원수 · 금일 방문자 + 방문 기록 테이블
-- 선행: migration_v28

-- ============================================================
-- 1) 방문자 로그 (금일 UV)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_date DATE NOT NULL,
  visitor_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT kemix_visitor_logs_unique_per_day UNIQUE (visit_date, visitor_key)
);

CREATE INDEX IF NOT EXISTS idx_kemix_visitor_logs_date
  ON public.kemix_visitor_logs (visit_date DESC);

ALTER TABLE public.kemix_visitor_logs ENABLE ROW LEVEL SECURITY;

-- 직접 접근 차단 — RPC 경유만 허용
DROP POLICY IF EXISTS "kemix_visitor_logs_no_direct" ON public.kemix_visitor_logs;
CREATE POLICY "kemix_visitor_logs_no_direct"
  ON public.kemix_visitor_logs FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- 2) 방문 기록 RPC (클라이언트 visitor_key 기준 일 1회)
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_site_visit(p_visitor_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT := TRIM(p_visitor_key);
  v_today DATE := (TIMEZONE('Asia/Seoul', NOW()))::DATE;
BEGIN
  IF v_key IS NULL OR v_key = '' OR length(v_key) > 128 THEN
    RETURN;
  END IF;

  INSERT INTO public.kemix_visitor_logs (visit_date, visitor_key)
  VALUES (v_today, v_key)
  ON CONFLICT (visit_date, visitor_key) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_site_visit(TEXT) TO anon, authenticated;

-- ============================================================
-- 3) 플랫폼 통계 RPC 갱신
-- ============================================================
DROP FUNCTION IF EXISTS public.get_kemi_platform_stats();

CREATE FUNCTION public.get_kemi_platform_stats()
RETURNS TABLE (
  download_count INTEGER,
  guide_count INTEGER,
  member_count INTEGER,
  today_visitor_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((
      SELECT total_downloads::INTEGER
      FROM public.kemix_platform_metrics
      LIMIT 1
    ), 0) AS download_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.kemi_posts p
      WHERE p.is_published = true
    ), 0) AS guide_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.user_profiles up
    ), 0) AS member_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.kemix_visitor_logs vl
      WHERE vl.visit_date = (TIMEZONE('Asia/Seoul', NOW()))::DATE
    ), 0) AS today_visitor_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_kemi_platform_stats() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
