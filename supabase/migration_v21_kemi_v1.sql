-- KEMI V1: 병원 응급 장비 오버라이드 + 공식 블로그(posts)
-- 선행: migration_v20 (custom_hospitals), migration_v4 (is_approved_admin)

-- ============================================================
-- 1) custom_hospitals 응급 장비/연락처 오버라이드 컬럼
-- ============================================================
ALTER TABLE public.custom_hospitals
  ADD COLUMN IF NOT EXISTS hvctayn TEXT,
  ADD COLUMN IF NOT EXISTS hvmriayn TEXT,
  ADD COLUMN IF NOT EXISTS hvangioayn TEXT,
  ADD COLUMN IF NOT EXISTS hvventiayn TEXT,
  ADD COLUMN IF NOT EXISTS hvamyn TEXT,
  ADD COLUMN IF NOT EXISTS hv120 TEXT,
  ADD COLUMN IF NOT EXISTS hv122 TEXT,
  ADD COLUMN IF NOT EXISTS hv2 INTEGER,
  ADD COLUMN IF NOT EXISTS hv3 INTEGER,
  ADD COLUMN IF NOT EXISTS hv4 INTEGER,
  ADD COLUMN IF NOT EXISTS hv5 INTEGER,
  ADD COLUMN IF NOT EXISTS hv6 INTEGER,
  ADD COLUMN IF NOT EXISTS hv7 INTEGER,
  ADD COLUMN IF NOT EXISTS hv8 INTEGER,
  ADD COLUMN IF NOT EXISTS hv9 INTEGER,
  ADD COLUMN IF NOT EXISTS hv10 TEXT,
  ADD COLUMN IF NOT EXISTS hv11 TEXT;

-- ============================================================
-- 2) KEMI 공식 블로그 posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemi_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemi_posts_published ON public.kemi_posts (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kemi_posts_slug ON public.kemi_posts (slug);

ALTER TABLE public.kemi_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemi_posts_public_read" ON public.kemi_posts;
CREATE POLICY "kemi_posts_public_read" ON public.kemi_posts
  FOR SELECT USING (is_published = true);

-- ============================================================
-- 3) 공개 블로그 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_kemi_posts(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  thumbnail_url TEXT,
  views INTEGER,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.slug,
    p.thumbnail_url,
    p.views,
    p.seo_title,
    p.seo_description,
    p.created_at,
    p.updated_at
  FROM public.kemi_posts p
  WHERE p.is_published = true
  ORDER BY p.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
$$;

CREATE OR REPLACE FUNCTION public.get_kemi_post_by_slug(p_slug TEXT)
RETURNS public.kemi_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.kemi_posts;
BEGIN
  UPDATE public.kemi_posts
  SET views = views + 1,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE slug = TRIM(p_slug)
    AND is_published = true
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- ============================================================
-- 4) 관리자 블로그 RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_kemi_posts(
  p_search TEXT DEFAULT NULL,
  p_include_unpublished BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.kemi_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT p.*
  FROM public.kemi_posts p
  WHERE (
      p_search IS NULL OR TRIM(p_search) = ''
      OR p.title ILIKE '%' || TRIM(p_search) || '%'
      OR p.slug ILIKE '%' || TRIM(p_search) || '%'
      OR p.content ILIKE '%' || TRIM(p_search) || '%'
    )
    AND (COALESCE(p_include_unpublished, true) OR p.is_published = true)
  ORDER BY p.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200))
  OFFSET GREATEST(0, p_offset);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_kemi_post(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT '',
  p_slug TEXT DEFAULT '',
  p_content TEXT DEFAULT '',
  p_thumbnail_url TEXT DEFAULT NULL,
  p_is_published BOOLEAN DEFAULT false,
  p_seo_title TEXT DEFAULT NULL,
  p_seo_description TEXT DEFAULT NULL
)
RETURNS public.kemi_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.kemi_posts;
  v_slug TEXT := LOWER(REGEXP_REPLACE(TRIM(p_slug), '\s+', '-', 'g'));
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF TRIM(p_title) = '' OR v_slug = '' THEN
    RAISE EXCEPTION 'required_fields_missing';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemi_posts (
      title, slug, content, thumbnail_url, is_published, seo_title, seo_description
    )
    VALUES (
      TRIM(p_title),
      v_slug,
      COALESCE(p_content, ''),
      NULLIF(TRIM(p_thumbnail_url), ''),
      COALESCE(p_is_published, false),
      NULLIF(TRIM(p_seo_title), ''),
      NULLIF(TRIM(p_seo_description), '')
    )
    RETURNING * INTO v_row;

    PERFORM public.write_audit_log('kemi_post_created', 'kemi_post', v_row.id::text, to_jsonb(v_row));
  ELSE
    UPDATE public.kemi_posts
    SET title = TRIM(p_title),
        slug = v_slug,
        content = COALESCE(p_content, content),
        thumbnail_url = NULLIF(TRIM(p_thumbnail_url), ''),
        is_published = COALESCE(p_is_published, is_published),
        seo_title = NULLIF(TRIM(p_seo_title), ''),
        seo_description = NULLIF(TRIM(p_seo_description), ''),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'kemi_post_not_found';
    END IF;

    PERFORM public.write_audit_log('kemi_post_updated', 'kemi_post', v_row.id::text, to_jsonb(v_row));
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_kemi_post(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.kemi_posts WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'kemi_post_not_found';
  END IF;

  PERFORM public.write_audit_log('kemi_post_deleted', 'kemi_post', p_id::text, '{}'::jsonb);
  RETURN true;
END;
$$;

-- ============================================================
-- 5) 병원 upsert RPC 확장 (장비/연락처 필드)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_upsert_custom_hospital(
  p_id UUID DEFAULT NULL,
  p_external_id TEXT DEFAULT NULL,
  p_hpid TEXT DEFAULT NULL,
  p_name TEXT DEFAULT '',
  p_hospital_type TEXT DEFAULT 'general',
  p_sido TEXT DEFAULT '',
  p_sigungu TEXT DEFAULT '',
  p_address TEXT DEFAULT NULL,
  p_tel TEXT DEFAULT '',
  p_operating_hours JSONB DEFAULT '[]'::jsonb,
  p_departments TEXT[] DEFAULT '{}',
  p_custom_memo TEXT DEFAULT NULL,
  p_is_hidden BOOLEAN DEFAULT false,
  p_is_partner BOOLEAN DEFAULT false,
  p_er_capable BOOLEAN DEFAULT false,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_hvctayn TEXT DEFAULT NULL,
  p_hvmriayn TEXT DEFAULT NULL,
  p_hvangioayn TEXT DEFAULT NULL,
  p_hvventiayn TEXT DEFAULT NULL,
  p_hvamyn TEXT DEFAULT NULL,
  p_hv120 TEXT DEFAULT NULL,
  p_hv122 TEXT DEFAULT NULL,
  p_hv2 INTEGER DEFAULT NULL,
  p_hv3 INTEGER DEFAULT NULL,
  p_hv4 INTEGER DEFAULT NULL,
  p_hv5 INTEGER DEFAULT NULL,
  p_hv6 INTEGER DEFAULT NULL,
  p_hv7 INTEGER DEFAULT NULL,
  p_hv8 INTEGER DEFAULT NULL,
  p_hv9 INTEGER DEFAULT NULL,
  p_hv10 TEXT DEFAULT NULL,
  p_hv11 TEXT DEFAULT NULL
)
RETURNS public.custom_hospitals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.custom_hospitals;
  v_external TEXT := NULLIF(TRIM(p_external_id), '');
  v_type TEXT := COALESCE(NULLIF(TRIM(p_hospital_type), ''), 'general');
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF TRIM(p_name) = '' OR TRIM(p_sido) = '' OR TRIM(p_sigungu) = '' THEN
    RAISE EXCEPTION 'required_fields_missing';
  END IF;

  IF v_type NOT IN ('er', 'moonlight', 'pediatric', 'general') THEN
    RAISE EXCEPTION 'invalid_hospital_type';
  END IF;

  IF p_id IS NULL AND v_external IS NOT NULL THEN
    SELECT ch.id INTO p_id
    FROM public.custom_hospitals ch
    WHERE ch.external_id = v_external
    LIMIT 1;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.custom_hospitals (
      external_id, hpid, name, hospital_type, sido, sigungu, address, tel,
      operating_hours, departments, custom_memo, is_hidden, is_partner, er_capable,
      latitude, longitude,
      hvctayn, hvmriayn, hvangioayn, hvventiayn, hvamyn, hv120, hv122,
      hv2, hv3, hv4, hv5, hv6, hv7, hv8, hv9, hv10, hv11
    )
    VALUES (
      v_external,
      NULLIF(TRIM(p_hpid), ''),
      TRIM(p_name),
      v_type,
      TRIM(p_sido),
      TRIM(p_sigungu),
      NULLIF(TRIM(p_address), ''),
      COALESCE(NULLIF(TRIM(p_tel), ''), '-'),
      COALESCE(p_operating_hours, '[]'::jsonb),
      COALESCE(p_departments, '{}'),
      NULLIF(TRIM(p_custom_memo), ''),
      COALESCE(p_is_hidden, false),
      COALESCE(p_is_partner, false),
      COALESCE(p_er_capable, v_type = 'er'),
      p_latitude,
      p_longitude,
      NULLIF(TRIM(p_hvctayn), ''),
      NULLIF(TRIM(p_hvmriayn), ''),
      NULLIF(TRIM(p_hvangioayn), ''),
      NULLIF(TRIM(p_hvventiayn), ''),
      NULLIF(TRIM(p_hvamyn), ''),
      NULLIF(TRIM(p_hv120), ''),
      NULLIF(TRIM(p_hv122), ''),
      p_hv2, p_hv3, p_hv4, p_hv5, p_hv6, p_hv7, p_hv8, p_hv9,
      NULLIF(TRIM(p_hv10), ''),
      NULLIF(TRIM(p_hv11), '')
    )
    RETURNING * INTO v_row;

    PERFORM public.write_audit_log('custom_hospital_created', 'custom_hospital', v_row.id::text, to_jsonb(v_row));
  ELSE
    UPDATE public.custom_hospitals
    SET external_id = COALESCE(v_external, external_id),
        hpid = COALESCE(NULLIF(TRIM(p_hpid), ''), hpid),
        name = TRIM(p_name),
        hospital_type = v_type,
        sido = TRIM(p_sido),
        sigungu = TRIM(p_sigungu),
        address = NULLIF(TRIM(p_address), ''),
        tel = COALESCE(NULLIF(TRIM(p_tel), ''), '-'),
        operating_hours = COALESCE(p_operating_hours, operating_hours),
        departments = COALESCE(p_departments, departments),
        custom_memo = NULLIF(TRIM(p_custom_memo), ''),
        is_hidden = COALESCE(p_is_hidden, is_hidden),
        is_partner = COALESCE(p_is_partner, is_partner),
        er_capable = COALESCE(p_er_capable, er_capable),
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        hvctayn = COALESCE(NULLIF(TRIM(p_hvctayn), ''), hvctayn),
        hvmriayn = COALESCE(NULLIF(TRIM(p_hvmriayn), ''), hvmriayn),
        hvangioayn = COALESCE(NULLIF(TRIM(p_hvangioayn), ''), hvangioayn),
        hvventiayn = COALESCE(NULLIF(TRIM(p_hvventiayn), ''), hvventiayn),
        hvamyn = COALESCE(NULLIF(TRIM(p_hvamyn), ''), hvamyn),
        hv120 = COALESCE(NULLIF(TRIM(p_hv120), ''), hv120),
        hv122 = COALESCE(NULLIF(TRIM(p_hv122), ''), hv122),
        hv2 = COALESCE(p_hv2, hv2),
        hv3 = COALESCE(p_hv3, hv3),
        hv4 = COALESCE(p_hv4, hv4),
        hv5 = COALESCE(p_hv5, hv5),
        hv6 = COALESCE(p_hv6, hv6),
        hv7 = COALESCE(p_hv7, hv7),
        hv8 = COALESCE(p_hv8, hv8),
        hv9 = COALESCE(p_hv9, hv9),
        hv10 = COALESCE(NULLIF(TRIM(p_hv10), ''), hv10),
        hv11 = COALESCE(NULLIF(TRIM(p_hv11), ''), hv11),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'custom_hospital_not_found';
    END IF;

    PERFORM public.write_audit_log('custom_hospital_updated', 'custom_hospital', v_row.id::text, to_jsonb(v_row));
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_published_kemi_posts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_kemi_post_by_slug TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_kemi_posts TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_kemi_post TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_kemi_post TO authenticated;

NOTIFY pgrst, 'reload schema';
