-- migration_v30_kemix_content_fixes.sql
-- 관리자 RPC 권한 + 교육 카테고리 테이블 + 일정/교육 연동 보완
-- 선행: migration_v29

-- ============================================================
-- 1) 교육 카테고리
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_training_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.kemix_training_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_training_categories_public_read" ON public.kemix_training_categories;
CREATE POLICY "kemix_training_categories_public_read"
  ON public.kemix_training_categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "kemix_training_categories_admin_all" ON public.kemix_training_categories;
CREATE POLICY "kemix_training_categories_admin_all"
  ON public.kemix_training_categories FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

INSERT INTO public.kemix_training_categories (name, slug, display_order, is_active)
VALUES
  ('응급의료', 'emergency', 1, true),
  ('BLS/ACLS', 'bls-acls', 2, true),
  ('학술대회', 'conference', 3, true),
  ('기타', 'general', 4, true)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.list_active_training_categories()
RETURNS SETOF public.kemix_training_categories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_training_categories
  WHERE is_active = true
  ORDER BY display_order ASC, name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_training_categories() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_training_categories()
RETURNS SETOF public.kemix_training_categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.kemix_training_categories
    ORDER BY display_order ASC, name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_training_categories() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_training_category(
  p_id UUID DEFAULT NULL,
  p_name TEXT DEFAULT '',
  p_slug TEXT DEFAULT '',
  p_display_order INTEGER DEFAULT 0,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS public.kemix_training_categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_training_categories;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_training_categories (name, slug, display_order, is_active)
    VALUES (p_name, p_slug, COALESCE(p_display_order, 0), COALESCE(p_is_active, true))
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_training_categories SET
      name = COALESCE(NULLIF(p_name, ''), name),
      slug = COALESCE(NULLIF(p_slug, ''), slug),
      display_order = COALESCE(p_display_order, display_order),
      is_active = COALESCE(p_is_active, is_active)
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_training_category(UUID, TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_training_category(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.kemix_training_categories WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_training_category(UUID) TO authenticated;

-- ============================================================
-- 2) 관리자 RPC 실행 권한 (v29 누락분)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.admin_list_schedules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_schedule(UUID, TEXT, DATE, DATE, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_schedule(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_trainings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_training(UUID, TEXT, TEXT, DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_training(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
