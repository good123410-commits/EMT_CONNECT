-- migration_v28_kemix_download_count_no_floor.sql
-- 앱 누적 다운로드 최소값(10,000) 제거 — DB 실제 수치(0 포함) 반환

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
