-- KEMIX 자료실 & 앱 다운로드 설정
-- 선행: migration_v5 (is_approved_admin)

-- ============================================================
-- 1) 자료실
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_resources_published
  ON public.kemix_resources (is_published, display_order ASC, created_at DESC);

ALTER TABLE public.kemix_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_resources_public_read" ON public.kemix_resources;
CREATE POLICY "kemix_resources_public_read"
  ON public.kemix_resources FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "kemix_resources_admin_all" ON public.kemix_resources;
CREATE POLICY "kemix_resources_admin_all"
  ON public.kemix_resources FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 2) 앱 다운로드 설정 (싱글톤)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_app_download_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  ios_store_url TEXT NOT NULL DEFAULT '',
  android_store_url TEXT NOT NULL DEFAULT '',
  deep_link TEXT NOT NULL DEFAULT 'emtconnect://map',
  latest_version TEXT,
  qr_code_image_url TEXT,
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.kemix_app_download_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_app_download_settings_public_read" ON public.kemix_app_download_settings;
CREATE POLICY "kemix_app_download_settings_public_read"
  ON public.kemix_app_download_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "kemix_app_download_settings_admin_all" ON public.kemix_app_download_settings;
CREATE POLICY "kemix_app_download_settings_admin_all"
  ON public.kemix_app_download_settings FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

INSERT INTO public.kemix_app_download_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3) 공개 RPC — 자료실
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_resources(p_limit INTEGER DEFAULT 100)
RETURNS SETOF public.kemix_resources
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_resources
  WHERE is_published = true
  ORDER BY display_order ASC, created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 200));
$$;

GRANT EXECUTE ON FUNCTION public.list_published_resources(INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_published_resource(p_id UUID)
RETURNS public.kemix_resources
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_resources;
BEGIN
  SELECT * INTO v_row
  FROM public.kemix_resources
  WHERE id = p_id AND is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_published_resource(UUID) TO anon, authenticated;

-- ============================================================
-- 4) 관리자 RPC — 자료실 CRUD
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_resources()
RETURNS SETOF public.kemix_resources
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.kemix_resources
    ORDER BY display_order ASC, created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_resources() TO authenticated;

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
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_resources (
      title, description, category, file_url, file_name, file_size, display_order, is_published
    ) VALUES (
      p_title,
      COALESCE(p_description, ''),
      COALESCE(p_category, 'general'),
      p_file_url,
      p_file_name,
      p_file_size,
      COALESCE(p_display_order, 0),
      COALESCE(p_is_published, true)
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_resources SET
      title = COALESCE(p_title, title),
      description = COALESCE(p_description, description),
      category = COALESCE(p_category, category),
      file_url = COALESCE(p_file_url, file_url),
      file_name = COALESCE(p_file_name, file_name),
      file_size = COALESCE(p_file_size, file_size),
      display_order = COALESCE(p_display_order, display_order),
      is_published = COALESCE(p_is_published, is_published),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_resource(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, INTEGER, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_resource(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.kemix_resources WHERE id = p_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_resource(UUID) TO authenticated;

-- ============================================================
-- 5) 공개/관리자 RPC — 앱 다운로드 설정
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_app_download_settings()
RETURNS public.kemix_app_download_settings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_app_download_settings
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_app_download_settings() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_app_download_settings(
  p_ios_store_url TEXT DEFAULT NULL,
  p_android_store_url TEXT DEFAULT NULL,
  p_deep_link TEXT DEFAULT NULL,
  p_latest_version TEXT DEFAULT NULL,
  p_qr_code_image_url TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS public.kemix_app_download_settings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_app_download_settings;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.kemix_app_download_settings SET
    ios_store_url = COALESCE(p_ios_store_url, ios_store_url),
    android_store_url = COALESCE(p_android_store_url, android_store_url),
    deep_link = COALESCE(p_deep_link, deep_link),
    latest_version = COALESCE(p_latest_version, latest_version),
    qr_code_image_url = COALESCE(p_qr_code_image_url, qr_code_image_url),
    description = COALESCE(p_description, description),
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_app_download_settings(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
