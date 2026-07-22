-- 자체 병원 데이터 (공공 API 보완 · 관리자 CRUD)
-- 선행: migration_v3 (is_approved_admin), migration_v4 (write_audit_log)

CREATE TABLE IF NOT EXISTS public.custom_hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  hpid TEXT,
  name TEXT NOT NULL,
  hospital_type TEXT NOT NULL DEFAULT 'general'
    CHECK (hospital_type IN ('er', 'moonlight', 'pediatric', 'general')),
  sido TEXT NOT NULL,
  sigungu TEXT NOT NULL,
  address TEXT,
  tel TEXT NOT NULL DEFAULT '',
  operating_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  departments TEXT[] NOT NULL DEFAULT '{}',
  custom_memo TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_partner BOOLEAN NOT NULL DEFAULT false,
  er_capable BOOLEAN NOT NULL DEFAULT false,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_custom_hospitals_region ON public.custom_hospitals (sido, sigungu);
CREATE INDEX IF NOT EXISTS idx_custom_hospitals_name ON public.custom_hospitals (name);
CREATE INDEX IF NOT EXISTS idx_custom_hospitals_hpid ON public.custom_hospitals (hpid);
CREATE INDEX IF NOT EXISTS idx_custom_hospitals_external ON public.custom_hospitals (external_id);
CREATE INDEX IF NOT EXISTS idx_custom_hospitals_visible ON public.custom_hospitals (is_hidden) WHERE is_hidden = false;

ALTER TABLE public.custom_hospitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_hospitals_public_read" ON public.custom_hospitals;
CREATE POLICY "custom_hospitals_public_read" ON public.custom_hospitals
  FOR SELECT USING (is_hidden = false);

-- ============================================================
-- 관리자 목록 (숨김 포함)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_custom_hospitals(
  p_sido TEXT DEFAULT NULL,
  p_sigungu TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_include_hidden BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 200,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.custom_hospitals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sido TEXT := NULLIF(TRIM(p_sido), '');
  v_sido_short TEXT;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF v_sido IS NOT NULL THEN
    v_sido_short := CASE v_sido
      WHEN '서울특별시' THEN '서울'
      WHEN '부산광역시' THEN '부산'
      WHEN '대구광역시' THEN '대구'
      WHEN '인천광역시' THEN '인천'
      WHEN '광주광역시' THEN '광주'
      WHEN '대전광역시' THEN '대전'
      WHEN '울산광역시' THEN '울산'
      WHEN '세종특별자치시' THEN '세종'
      WHEN '경기도' THEN '경기'
      WHEN '강원특별자치도' THEN '강원'
      WHEN '충청북도' THEN '충북'
      WHEN '충청남도' THEN '충남'
      WHEN '전북특별자치도' THEN '전북'
      WHEN '전라남도' THEN '전남'
      WHEN '경상북도' THEN '경북'
      WHEN '경상남도' THEN '경남'
      WHEN '제주특별자치도' THEN '제주'
      ELSE v_sido
    END;
  END IF;

  RETURN QUERY
  SELECT ch.*
  FROM public.custom_hospitals ch
  WHERE (
      v_sido IS NULL
      OR ch.sido = v_sido
      OR ch.sido = v_sido_short
      OR ch.sido ILIKE '%' || v_sido_short || '%'
    )
    AND (p_sigungu IS NULL OR TRIM(p_sigungu) = '' OR ch.sigungu ILIKE '%' || TRIM(p_sigungu) || '%')
    AND (
      p_search IS NULL OR TRIM(p_search) = ''
      OR ch.name ILIKE '%' || TRIM(p_search) || '%'
      OR ch.tel ILIKE '%' || TRIM(p_search) || '%'
      OR COALESCE(ch.address, '') ILIKE '%' || TRIM(p_search) || '%'
      OR COALESCE(ch.hpid, '') ILIKE '%' || TRIM(p_search) || '%'
      OR COALESCE(ch.external_id, '') ILIKE '%' || TRIM(p_search) || '%'
    )
    AND (COALESCE(p_include_hidden, true) OR ch.is_hidden = false)
  ORDER BY ch.sido, ch.sigungu, ch.name
  LIMIT GREATEST(1, LEAST(p_limit, 500))
  OFFSET GREATEST(0, p_offset);
END;
$$;

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
  p_longitude NUMERIC DEFAULT NULL
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
      latitude, longitude
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
      p_longitude
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

CREATE OR REPLACE FUNCTION public.admin_delete_custom_hospital(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.custom_hospitals WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'custom_hospital_not_found';
  END IF;

  PERFORM public.write_audit_log('custom_hospital_deleted', 'custom_hospital', p_id::text, '{}'::jsonb);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_custom_hospitals TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_custom_hospital TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_custom_hospital TO authenticated;

NOTIFY pgrst, 'reload schema';
