-- migration_v25_kemix_post_categories.sql
-- 가이드(kemi_posts) 카테고리 관리 테이블 및 RPC

CREATE TABLE IF NOT EXISTS public.kemix_post_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.kemix_post_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_post_categories_public_read" ON public.kemix_post_categories;
CREATE POLICY "kemix_post_categories_public_read"
  ON public.kemix_post_categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "kemix_post_categories_admin_all" ON public.kemix_post_categories;
CREATE POLICY "kemix_post_categories_admin_all"
  ON public.kemix_post_categories FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

INSERT INTO public.kemix_post_categories (name, slug, display_order, is_active)
VALUES
  ('심폐소생술', 'cpr', 1, true),
  ('외상', 'trauma', 2, true),
  ('중독', 'poisoning', 3, true),
  ('소아', 'pediatric', 4, true),
  ('화상', 'burn', 5, true),
  ('기타', 'general', 6, true)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.list_active_post_categories()
RETURNS SETOF public.kemix_post_categories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.kemix_post_categories WHERE is_active = true ORDER BY display_order ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_active_post_categories() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_post_categories()
RETURNS SETOF public.kemix_post_categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY SELECT * FROM public.kemix_post_categories ORDER BY display_order ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_post_categories() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_post_category(
  p_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT '',
  p_slug TEXT DEFAULT '',
  p_display_order INTEGER DEFAULT 0,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS public.kemix_post_categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.kemix_post_categories;
  v_slug TEXT := LOWER(REGEXP_REPLACE(TRIM(p_slug), '\s+', '-', 'g'));
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF TRIM(p_name) = '' OR v_slug = '' THEN RAISE EXCEPTION 'required_fields_missing'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.kemix_post_categories (name, slug, display_order, is_active)
    VALUES (TRIM(p_name), v_slug, COALESCE(p_display_order, 0), COALESCE(p_is_active, true))
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_post_categories SET
      name = TRIM(p_name),
      slug = v_slug,
      display_order = COALESCE(p_display_order, display_order),
      is_active = COALESCE(p_is_active, is_active)
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_upsert_post_category(UUID, TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_post_category(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  DELETE FROM public.kemix_post_categories WHERE id = p_id;
  RETURN FOUND;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_post_category(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
