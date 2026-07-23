-- admin_upsert_resource: 필수값 검증 및 저장 실패 시 명확한 오류 반환

CREATE OR REPLACE FUNCTION public.admin_upsert_resource(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_category TEXT DEFAULT 'general',
  p_file_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_file_size BIGINT DEFAULT NULL,
  p_display_order INTEGER DEFAULT 0,
  p_is_published BOOLEAN DEFAULT true
)
RETURNS public.kemix_resources
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_resources;
  v_title TEXT := NULLIF(BTRIM(p_title), '');
  v_file_url TEXT := NULLIF(BTRIM(p_file_url), '');
  v_file_name TEXT := NULLIF(BTRIM(p_file_name), '');
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_title IS NULL THEN
    RAISE EXCEPTION 'title is required';
  END IF;

  IF v_file_url IS NULL OR v_file_name IS NULL THEN
    RAISE EXCEPTION 'file_url and file_name are required';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_resources (
      title, description, category, file_url, file_name, file_size, display_order, is_published
    ) VALUES (
      v_title,
      COALESCE(p_description, ''),
      COALESCE(NULLIF(BTRIM(p_category), ''), 'general'),
      v_file_url,
      v_file_name,
      p_file_size,
      COALESCE(p_display_order, 0),
      COALESCE(p_is_published, true)
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_resources SET
      title = v_title,
      description = COALESCE(p_description, description),
      category = COALESCE(NULLIF(BTRIM(p_category), ''), category),
      file_url = v_file_url,
      file_name = v_file_name,
      file_size = COALESCE(p_file_size, file_size),
      display_order = COALESCE(p_display_order, display_order),
      is_published = COALESCE(p_is_published, is_published),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'resource not found';
    END IF;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_resource(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, INTEGER, BOOLEAN) TO authenticated;
