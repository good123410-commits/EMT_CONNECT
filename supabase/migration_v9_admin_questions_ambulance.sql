-- 일반인 Q&A 관리 + 민간구급차 admin upsert 보완

-- 질문: 관리자 수정/삭제
DROP POLICY IF EXISTS "questions_admin_update" ON public.questions;
CREATE POLICY "questions_admin_update" ON public.questions
  FOR UPDATE USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

DROP POLICY IF EXISTS "questions_admin_delete" ON public.questions;
CREATE POLICY "questions_admin_delete" ON public.questions
  FOR DELETE USING (public.is_approved_admin());

DROP POLICY IF EXISTS "answers_admin_delete" ON public.answers;
CREATE POLICY "answers_admin_delete" ON public.answers
  FOR DELETE USING (public.is_approved_admin());

-- 민간구급차 목록: 시도 약어/정식명 모두 검색
CREATE OR REPLACE FUNCTION public.admin_list_private_ambulances(
  p_sido TEXT DEFAULT NULL,
  p_sigungu TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.private_ambulances
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
  SELECT pa.*
  FROM public.private_ambulances pa
  WHERE (
      v_sido IS NULL
      OR pa.sido = v_sido
      OR pa.sido = v_sido_short
      OR pa.region ILIKE '%' || v_sido_short || '%'
    )
    AND (p_sigungu IS NULL OR TRIM(p_sigungu) = '' OR pa.sigungu ILIKE '%' || TRIM(p_sigungu) || '%')
    AND (
      p_search IS NULL OR TRIM(p_search) = ''
      OR pa.name ILIKE '%' || TRIM(p_search) || '%'
      OR pa.phone ILIKE '%' || TRIM(p_search) || '%'
    )
  ORDER BY pa.sido, pa.sigungu, pa.name
  LIMIT GREATEST(1, LEAST(p_limit, 500))
  OFFSET GREATEST(0, p_offset);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_private_ambulance(
  p_id UUID DEFAULT NULL,
  p_external_id TEXT DEFAULT NULL,
  p_name TEXT DEFAULT '',
  p_vehicle_type TEXT DEFAULT NULL,
  p_vehicle_count INTEGER DEFAULT 1,
  p_region TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT '',
  p_sido TEXT DEFAULT '',
  p_sigungu TEXT DEFAULT '',
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL
)
RETURNS public.private_ambulances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_ambulances;
  v_external TEXT := NULLIF(TRIM(p_external_id), '');
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF TRIM(p_name) = '' OR TRIM(p_phone) = '' OR TRIM(p_sido) = '' OR TRIM(p_sigungu) = '' THEN
    RAISE EXCEPTION 'required_fields_missing';
  END IF;

  IF p_id IS NULL AND v_external IS NOT NULL THEN
    SELECT pa.id INTO p_id
    FROM public.private_ambulances pa
    WHERE pa.external_id = v_external
    LIMIT 1;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.private_ambulances (
      external_id, name, vehicle_type, vehicle_count, region, address,
      phone, sido, sigungu, latitude, longitude
    )
    VALUES (
      v_external, TRIM(p_name), p_vehicle_type, GREATEST(1, COALESCE(p_vehicle_count, 1)),
      p_region, p_address, TRIM(p_phone), TRIM(p_sido), TRIM(p_sigungu), p_latitude, p_longitude
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.private_ambulances
    SET external_id = COALESCE(v_external, external_id),
        name = TRIM(p_name),
        vehicle_type = p_vehicle_type,
        vehicle_count = GREATEST(1, COALESCE(p_vehicle_count, 1)),
        region = p_region,
        address = p_address,
        phone = TRIM(p_phone),
        sido = TRIM(p_sido),
        sigungu = TRIM(p_sigungu),
        latitude = p_latitude,
        longitude = p_longitude,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'private_ambulance_not_found';
    END IF;
  END IF;

  BEGIN
    PERFORM public.write_audit_log(
      CASE WHEN p_id IS NULL THEN 'private_ambulance_created' ELSE 'private_ambulance_updated' END,
      'private_ambulance',
      v_row.id::text,
      jsonb_build_object('external_id', v_row.external_id, 'name', v_row.name)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_private_ambulances(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_private_ambulance(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC) TO authenticated;

NOTIFY pgrst, 'reload schema';
