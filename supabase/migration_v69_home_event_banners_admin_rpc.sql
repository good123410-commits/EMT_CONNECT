-- 홈 이벤트 배너 관리자 RPC (목록·저장·삭제)
-- 선행: migration_v56_home_event_banners.sql

CREATE OR REPLACE FUNCTION public.admin_list_home_event_banners()
RETURNS SETOF public.kemix_home_event_banners
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.kemix_home_event_banners
  ORDER BY sort_order ASC, created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_home_event_banners() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_home_event_banner(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_image_url TEXT DEFAULT NULL,
  p_link_url TEXT DEFAULT '',
  p_is_active BOOLEAN DEFAULT true,
  p_sort_order INTEGER DEFAULT 0
)
RETURNS public.kemix_home_event_banners
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.kemix_home_event_banners;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_home_event_banners (
      title,
      description,
      image_url,
      link_url,
      is_active,
      sort_order
    ) VALUES (
      COALESCE(p_title, ''),
      COALESCE(p_description, ''),
      NULLIF(TRIM(p_image_url), ''),
      COALESCE(p_link_url, ''),
      COALESCE(p_is_active, true),
      COALESCE(p_sort_order, 0)
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_home_event_banners
    SET
      title = COALESCE(p_title, title),
      description = COALESCE(p_description, description),
      image_url = NULLIF(TRIM(p_image_url), ''),
      link_url = COALESCE(p_link_url, link_url),
      is_active = COALESCE(p_is_active, is_active),
      sort_order = COALESCE(p_sort_order, sort_order),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'banner_not_found';
    END IF;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_home_event_banner(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_home_event_banner(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    RAISE EXCEPTION 'banner_id_required';
  END IF;

  DELETE FROM public.kemix_home_event_banners
  WHERE id = p_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_home_event_banner(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
