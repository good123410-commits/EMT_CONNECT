-- EMS Connect V4: 통합 관리자 대시보드
-- migration_v2_channels.sql, migration_v3_questions_*.sql 실행 후 적용

-- ============================================================
-- 1. user_profiles 확장 (admin 역할 · 차단)
-- ============================================================
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'hospital', 'paramedic', 'private_ems', 'admin'));

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs (actor_id);

-- ============================================================
-- 3. job_posts (구인/구직)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type TEXT NOT NULL CHECK (post_type IN ('hire', 'seek')),
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  salary TEXT,
  schedule TEXT,
  requirements TEXT,
  content TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_job_posts_type ON public.job_posts (post_type);
CREATE INDEX IF NOT EXISTS idx_job_posts_published ON public.job_posts (is_published, created_at DESC);

-- ============================================================
-- 4. private_ambulances (민간 구급차 마스터)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.private_ambulances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  vehicle_type TEXT,
  vehicle_count INTEGER NOT NULL DEFAULT 1,
  region TEXT,
  address TEXT,
  phone TEXT NOT NULL,
  sido TEXT NOT NULL,
  sigungu TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_private_ambulances_region ON public.private_ambulances (sido, sigungu);
CREATE INDEX IF NOT EXISTS idx_private_ambulances_name ON public.private_ambulances (name);

-- ============================================================
-- 5. invitation_codes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  target_role TEXT NOT NULL CHECK (target_role IN ('hospital', 'paramedic', 'private_ems', 'admin')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ============================================================
-- 6. RLS
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- audit_logs: admin만 조회
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (public.is_approved_admin());

-- job_posts: 공개 게시물 읽기, admin 전체
DROP POLICY IF EXISTS "job_posts_public_read" ON public.job_posts;
CREATE POLICY "job_posts_public_read" ON public.job_posts
  FOR SELECT USING (is_published = true OR public.is_approved_admin());

-- private_ambulances: 전체 읽기, admin 쓰기는 RPC로 처리
DROP POLICY IF EXISTS "private_ambulances_public_read" ON public.private_ambulances;
CREATE POLICY "private_ambulances_public_read" ON public.private_ambulances
  FOR SELECT USING (true);

-- invitation_codes: admin만 조회
DROP POLICY IF EXISTS "invitation_codes_select_admin" ON public.invitation_codes;
CREATE POLICY "invitation_codes_select_admin" ON public.invitation_codes
  FOR SELECT USING (public.is_approved_admin());

-- user_profiles: admin 전체 조회
DROP POLICY IF EXISTS "user_profiles_select_admin" ON public.user_profiles;
CREATE POLICY "user_profiles_select_admin" ON public.user_profiles
  FOR SELECT USING (public.is_approved_admin());

-- emt_verifications: admin 조회
DROP POLICY IF EXISTS "emt_verifications_select_admin" ON public.emt_verifications;
CREATE POLICY "emt_verifications_select_admin" ON public.emt_verifications
  FOR SELECT USING (public.is_approved_admin());

-- hidden_posts: admin 조회 (활동 로그용)
DROP POLICY IF EXISTS "hidden_posts_select_admin" ON public.hidden_posts;
CREATE POLICY "hidden_posts_select_admin" ON public.hidden_posts
  FOR SELECT USING (public.is_approved_admin());

-- emergency_guides: admin CRUD
DROP POLICY IF EXISTS "emergency_guides_admin_write" ON public.emergency_guides;
CREATE POLICY "emergency_guides_admin_write" ON public.emergency_guides
  FOR ALL USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 7. 감사 로그 헬퍼
-- ============================================================
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, COALESCE(p_details, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================================
-- 8. 관리자 RPC — 유저
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT up.*
  FROM public.user_profiles up
  WHERE (
    p_search IS NULL OR TRIM(p_search) = ''
    OR up.email ILIKE '%' || TRIM(p_search) || '%'
    OR up.name ILIKE '%' || TRIM(p_search) || '%'
    OR up.company_name ILIKE '%' || TRIM(p_search) || '%'
  )
  ORDER BY up.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200))
  OFFSET GREATEST(0, p_offset);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_activity(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  SELECT jsonb_build_object(
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', q.id, 'title', q.title, 'status', q.status, 'created_at', q.created_at
      ) ORDER BY q.created_at DESC)
      FROM public.questions q WHERE q.user_id = p_user_id
    ), '[]'::jsonb),
    'posts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', hp.id, 'title', hp.title, 'target_role', hp.target_role, 'created_at', hp.created_at
      ) ORDER BY hp.created_at DESC)
      FROM public.hidden_posts hp WHERE hp.author_id = p_user_id
    ), '[]'::jsonb),
    'answers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'question_id', a.question_id, 'created_at', a.created_at
      ) ORDER BY a.created_at DESC)
      FROM public.answers a WHERE a.paramedic_id = p_user_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(
  p_user_id UUID,
  p_blocked BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.user_profiles;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_block_self';
  END IF;

  UPDATE public.user_profiles
  SET is_blocked = p_blocked
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  PERFORM public.write_audit_log(
    CASE WHEN p_blocked THEN 'user_blocked' ELSE 'user_unblocked' END,
    'user',
    p_user_id::text,
    jsonb_build_object('reason', p_reason)
  );

  RETURN v_profile;
END;
$$;

-- ============================================================
-- 9. 관리자 RPC — 인증/초대
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_pending_verifications()
RETURNS SETOF public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT ev.*
  FROM public.emt_verifications ev
  WHERE ev.status = 'pending'
  ORDER BY ev.updated_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_verification(
  p_verification_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_target_role TEXT DEFAULT 'paramedic'
)
RETURNS public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.emt_verifications;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  UPDATE public.emt_verifications
  SET status = p_status,
      reviewer_notes = p_notes,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_verification_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'verification_not_found';
  END IF;

  IF p_status = 'approved' THEN
    UPDATE public.user_profiles
    SET role = COALESCE(NULLIF(TRIM(p_target_role), ''), 'paramedic'),
        is_approved = true
    WHERE id = v_row.user_id;
  END IF;

  PERFORM public.write_audit_log(
    CASE WHEN p_status = 'approved' THEN 'verification_approved' ELSE 'verification_rejected' END,
    'verification',
    p_verification_id::text,
    jsonb_build_object('user_id', v_row.user_id, 'notes', p_notes, 'target_role', p_target_role)
  );

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_invitation_code(
  p_target_role TEXT,
  p_expires_days INTEGER DEFAULT 30
)
RETURNS public.invitation_codes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_row public.invitation_codes;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF p_target_role NOT IN ('hospital', 'paramedic', 'private_ems', 'admin') THEN
    RAISE EXCEPTION 'invalid_target_role';
  END IF;

  v_code := upper(
    substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
    substr(md5(clock_timestamp()::text || random()::text), 1, 4) || '-' ||
    substr(md5((random() * 1000)::text), 1, 4)
  );

  INSERT INTO public.invitation_codes (code, target_role, created_by, expires_at)
  VALUES (
    v_code,
    p_target_role,
    auth.uid(),
    CASE
      WHEN p_expires_days IS NULL OR p_expires_days <= 0 THEN NULL
      ELSE TIMEZONE('utc'::text, NOW()) + (p_expires_days || ' days')::interval
    END
  )
  RETURNING * INTO v_row;

  PERFORM public.write_audit_log(
    'invitation_code_created',
    'invitation_code',
    v_row.id::text,
    jsonb_build_object('code', v_code, 'target_role', p_target_role)
  );

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_invitation_codes(p_limit INTEGER DEFAULT 50)
RETURNS SETOF public.invitation_codes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT ic.*
  FROM public.invitation_codes ic
  ORDER BY ic.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200));
END;
$$;

-- ============================================================
-- 10. 관리자 RPC — 구인/구직
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_upsert_job_post(
  p_id UUID DEFAULT NULL,
  p_post_type TEXT DEFAULT 'hire',
  p_title TEXT DEFAULT '',
  p_company TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_salary TEXT DEFAULT NULL,
  p_schedule TEXT DEFAULT NULL,
  p_requirements TEXT DEFAULT NULL,
  p_content TEXT DEFAULT NULL,
  p_is_urgent BOOLEAN DEFAULT false,
  p_is_published BOOLEAN DEFAULT true
)
RETURNS public.job_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.job_posts;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF TRIM(p_title) = '' THEN
    RAISE EXCEPTION 'title_required';
  END IF;

  IF p_post_type NOT IN ('hire', 'seek') THEN
    RAISE EXCEPTION 'invalid_post_type';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.job_posts (
      post_type, title, company, location, salary, schedule,
      requirements, content, is_urgent, is_published, author_id
    )
    VALUES (
      p_post_type, TRIM(p_title), p_company, p_location, p_salary, p_schedule,
      p_requirements, p_content, p_is_urgent, p_is_published, auth.uid()
    )
    RETURNING * INTO v_row;

    PERFORM public.write_audit_log('job_post_created', 'job_post', v_row.id::text, to_jsonb(v_row));
  ELSE
    UPDATE public.job_posts
    SET post_type = p_post_type,
        title = TRIM(p_title),
        company = p_company,
        location = p_location,
        salary = p_salary,
        schedule = p_schedule,
        requirements = p_requirements,
        content = p_content,
        is_urgent = p_is_urgent,
        is_published = p_is_published,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'job_post_not_found';
    END IF;

    PERFORM public.write_audit_log('job_post_updated', 'job_post', v_row.id::text, to_jsonb(v_row));
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_job_post(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.job_posts WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_post_not_found';
  END IF;

  PERFORM public.write_audit_log('job_post_deleted', 'job_post', p_id::text, '{}'::jsonb);
  RETURN true;
END;
$$;

-- ============================================================
-- 11. 관리자 RPC — 민간 구급차
-- ============================================================
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
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  RETURN QUERY
  SELECT pa.*
  FROM public.private_ambulances pa
  WHERE (p_sido IS NULL OR TRIM(p_sido) = '' OR pa.sido = TRIM(p_sido))
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
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF TRIM(p_name) = '' OR TRIM(p_phone) = '' OR TRIM(p_sido) = '' OR TRIM(p_sigungu) = '' THEN
    RAISE EXCEPTION 'required_fields_missing';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.private_ambulances (
      external_id, name, vehicle_type, vehicle_count, region, address,
      phone, sido, sigungu, latitude, longitude
    )
    VALUES (
      p_external_id, TRIM(p_name), p_vehicle_type, GREATEST(1, COALESCE(p_vehicle_count, 1)),
      p_region, p_address, TRIM(p_phone), TRIM(p_sido), TRIM(p_sigungu), p_latitude, p_longitude
    )
    RETURNING * INTO v_row;

    PERFORM public.write_audit_log('private_ambulance_created', 'private_ambulance', v_row.id::text, to_jsonb(v_row));
  ELSE
    UPDATE public.private_ambulances
    SET external_id = p_external_id,
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

    PERFORM public.write_audit_log('private_ambulance_updated', 'private_ambulance', v_row.id::text, to_jsonb(v_row));
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_private_ambulance(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.private_ambulances WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'private_ambulance_not_found';
  END IF;

  PERFORM public.write_audit_log('private_ambulance_deleted', 'private_ambulance', p_id::text, '{}'::jsonb);
  RETURN true;
END;
$$;
