-- migration_v32_kemix_opening_slides.sql
-- 오프닝·메인 히어로 슬라이드 (DB 우선, 로컬 fallback)
-- 선행: migration_v5

CREATE TABLE IF NOT EXISTS public.kemix_opening_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  fallback_url TEXT,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_opening_slides_active
  ON public.kemix_opening_slides (is_active, display_order);

ALTER TABLE public.kemix_opening_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_opening_slides_public_read" ON public.kemix_opening_slides;
CREATE POLICY "kemix_opening_slides_public_read"
  ON public.kemix_opening_slides FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "kemix_opening_slides_admin_all" ON public.kemix_opening_slides;
CREATE POLICY "kemix_opening_slides_admin_all"
  ON public.kemix_opening_slides FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

CREATE OR REPLACE FUNCTION public.list_active_opening_slides()
RETURNS SETOF public.kemix_opening_slides
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.kemix_opening_slides
  WHERE is_active = true
  ORDER BY display_order ASC, created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_opening_slides() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_opening_slides()
RETURNS SETOF public.kemix_opening_slides
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.kemix_opening_slides
    ORDER BY display_order ASC, created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_opening_slides() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_opening_slide(
  p_id UUID DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_fallback_url TEXT DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_caption TEXT DEFAULT NULL,
  p_display_order INTEGER DEFAULT 0,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS public.kemix_opening_slides
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_opening_slides;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_opening_slides (
      image_url, fallback_url, title, caption, display_order, is_active
    ) VALUES (
      p_image_url,
      p_fallback_url,
      COALESCE(p_title, ''),
      p_caption,
      COALESCE(p_display_order, 0),
      COALESCE(p_is_active, true)
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_opening_slides SET
      image_url = COALESCE(p_image_url, image_url),
      fallback_url = COALESCE(p_fallback_url, fallback_url),
      title = COALESCE(p_title, title),
      caption = COALESCE(p_caption, caption),
      display_order = COALESCE(p_display_order, display_order),
      is_active = COALESCE(p_is_active, is_active),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_opening_slide(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_opening_slide(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.kemix_opening_slides WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_opening_slide(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
