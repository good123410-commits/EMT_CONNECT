-- 홈 이벤트 배너 (동적 게시글형)
-- 선행: migration_v35

CREATE TABLE IF NOT EXISTS public.kemix_home_event_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  link_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_home_event_banners_active_sort
  ON public.kemix_home_event_banners (is_active, sort_order, created_at DESC);

ALTER TABLE public.kemix_home_event_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_home_event_banners_public_read" ON public.kemix_home_event_banners;
CREATE POLICY "kemix_home_event_banners_public_read"
  ON public.kemix_home_event_banners
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "kemix_home_event_banners_admin_all" ON public.kemix_home_event_banners;
CREATE POLICY "kemix_home_event_banners_admin_all"
  ON public.kemix_home_event_banners
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

CREATE OR REPLACE FUNCTION public.list_active_home_event_banners()
RETURNS SETOF public.kemix_home_event_banners
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.kemix_home_event_banners
  WHERE is_active = true
  ORDER BY sort_order ASC, created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_home_event_banners() TO anon, authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.kemix_home_event_banners;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
