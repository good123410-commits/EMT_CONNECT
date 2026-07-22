-- KEMI 플랫폼 스탯 RPC + kemi_posts Realtime
-- 선행: migration_v21 (kemi_posts)

CREATE OR REPLACE FUNCTION public.get_kemi_platform_stats()
RETURNS TABLE (
  hospital_count INTEGER,
  guide_count INTEGER,
  active_paramedic_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      2968 + COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM public.custom_hospitals ch
        WHERE ch.is_hidden = false
      ), 0)
    ) AS hospital_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.kemi_posts p
      WHERE p.is_published = true
    ), 0) AS guide_count,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.user_profiles up
      WHERE up.is_approved = true
        AND COALESCE(up.is_blocked, false) = false
        AND up.role IN ('paramedic', 'emt_certified', 'private_ems')
    ), 0) AS active_paramedic_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_kemi_platform_stats TO anon, authenticated;

-- Realtime publication (이미 추가된 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kemi_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kemi_posts;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

NOTIFY pgrst, 'reload schema';
