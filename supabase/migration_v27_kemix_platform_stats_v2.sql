-- migration_v27_kemix_platform_stats_v2.sql
-- 플랫폼 통계 RPC: 앱 다운로드 / 가이드 / 커뮤니티

CREATE TABLE IF NOT EXISTS public.kemix_platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_downloads INTEGER NOT NULL DEFAULT 0 CHECK (total_downloads >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

INSERT INTO public.kemix_platform_metrics (total_downloads)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM public.kemix_platform_metrics LIMIT 1);

ALTER TABLE public.kemix_platform_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_platform_metrics_public_read" ON public.kemix_platform_metrics;
CREATE POLICY "kemix_platform_metrics_public_read"
  ON public.kemix_platform_metrics FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "kemix_platform_metrics_admin_all" ON public.kemix_platform_metrics;
CREATE POLICY "kemix_platform_metrics_admin_all"
  ON public.kemix_platform_metrics FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 반환 컬럼 변경 시 CREATE OR REPLACE 불가 → 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS public.get_kemi_platform_stats();

CREATE FUNCTION public.get_kemi_platform_stats()
RETURNS TABLE (
  download_count INTEGER,
  guide_count INTEGER,
  community_count INTEGER
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
    GREATEST(
      COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM public.user_profiles up
        WHERE up.is_approved = true
          AND COALESCE(up.is_blocked, false) = false
      ), 0),
      COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM public.ems_community_posts ep
        WHERE ep.post_type = 'bamboo'
          AND COALESCE(ep.is_hidden, false) = false
      ), 0)
    ) AS community_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_kemi_platform_stats() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
