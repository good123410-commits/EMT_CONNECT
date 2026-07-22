-- =============================================================================
-- EMS Connect V5: 관리자 승인 + 인증/초대 필수 RPC (단일 실행본)
-- v2_channels 이후 SQL Editor에서 한 번에 실행하세요.
-- =============================================================================

-- 1) admin 역할 허용
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'hospital', 'paramedic', 'private_ems', 'admin'));

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- 2) 감사 로그
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3) 관리자 판별
CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role = 'admin'
      AND up.is_approved = true
  );
$$;

-- 4) 감사 로그 헬퍼
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

-- 5) 본인 관리자 승인 (로그인 계정)
CREATE OR REPLACE FUNCTION public.admin_self_approve()
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_auth_email TEXT;
  v_target public.user_profiles;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT LOWER(TRIM(u.email)) INTO v_auth_email
  FROM auth.users u
  WHERE u.id = v_caller_id;

  INSERT INTO public.user_profiles (id, email, role, is_approved)
  VALUES (v_caller_id, v_auth_email, 'admin', true)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      is_approved = true,
      email = COALESCE(EXCLUDED.email, public.user_profiles.email)
  RETURNING * INTO v_target;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'admin_self_approved',
    'user',
    v_target.id::text,
    jsonb_build_object('email', v_auth_email)
  );

  RETURN v_target;
END;
$$;

-- 6) 이메일 기반 관리자 승인 (제미나이 검증 로직 + 보안 보완)
CREATE OR REPLACE FUNCTION public.admin_approve_user_by_email(p_email TEXT)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_target public.user_profiles;
  v_normalized_email TEXT := LOWER(TRIM(p_email));
  v_auth_email TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF v_normalized_email = '' THEN
    RAISE EXCEPTION 'email_required';
  END IF;

  SELECT LOWER(TRIM(u.email)) INTO v_auth_email
  FROM auth.users u
  WHERE u.id = v_caller_id;

  -- 이미 관리자면: 이메일로 임의 계정 승격
  IF public.is_approved_admin() THEN
    SELECT up.* INTO v_target
    FROM public.user_profiles up
    WHERE LOWER(TRIM(COALESCE(up.email, ''))) = v_normalized_email
    LIMIT 1;

    IF v_target.id IS NULL THEN
      SELECT up.* INTO v_target
      FROM public.user_profiles up
      INNER JOIN auth.users u ON u.id = up.id
      WHERE LOWER(TRIM(u.email)) = v_normalized_email
      LIMIT 1;
    END IF;

    IF v_target.id IS NULL THEN
      RAISE EXCEPTION 'user_not_found';
    END IF;

    UPDATE public.user_profiles
    SET role = 'admin',
        is_approved = true
    WHERE id = v_target.id
    RETURNING * INTO v_target;
  ELSE
    -- 최초 승인: 로그인 이메일과 동일해야 함
    IF v_auth_email IS DISTINCT FROM v_normalized_email THEN
      RAISE EXCEPTION 'email_mismatch';
    END IF;

    SELECT up.* INTO v_target
    FROM public.user_profiles up
    WHERE LOWER(TRIM(COALESCE(up.email, ''))) = v_normalized_email
    LIMIT 1;

    IF v_target.id IS NOT NULL THEN
      UPDATE public.user_profiles
      SET role = 'admin',
          is_approved = true
      WHERE id = v_target.id
      RETURNING * INTO v_target;
    ELSE
      INSERT INTO public.user_profiles (id, email, role, is_approved)
      VALUES (v_caller_id, v_normalized_email, 'admin', true)
      ON CONFLICT (id) DO UPDATE
      SET role = 'admin',
          is_approved = true,
          email = EXCLUDED.email
      RETURNING * INTO v_target;
    END IF;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    v_caller_id,
    'admin_approved_by_email',
    'user',
    v_target.id::text,
    jsonb_build_object('email', v_normalized_email)
  );

  RETURN v_target;
END;
$$;

-- 7) 인증/초대 탭 필수 테이블·RPC (v4 미실행 환경 대비)
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

-- CREATE TABLE IF NOT EXISTS는 기존 테이블 컬럼을 추가하지 않음 → 누락 컬럼 보완
ALTER TABLE public.invitation_codes
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.invitation_codes
  ADD COLUMN IF NOT EXISTS used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.invitation_codes
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
ALTER TABLE public.invitation_codes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW());

UPDATE public.invitation_codes
SET created_at = TIMEZONE('utc'::text, NOW())
WHERE created_at IS NULL;

ALTER TABLE public.invitation_codes
  ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitation_codes_select_admin" ON public.invitation_codes;
CREATE POLICY "invitation_codes_select_admin" ON public.invitation_codes
  FOR SELECT USING (public.is_approved_admin());

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
    jsonb_build_object('user_id', v_row.user_id, 'notes', p_notes)
  );

  RETURN v_row;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_create_invitation_code(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.admin_create_invitation_code(TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.admin_create_invitation_code(
  p_target_role TEXT,
  p_expires_days INTEGER DEFAULT 30,
  p_recipient_email TEXT DEFAULT NULL
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
    jsonb_build_object(
      'code', v_code,
      'target_role', p_target_role,
      'recipient_email', NULLIF(TRIM(p_recipient_email), '')
    )
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
  ORDER BY ic.created_at DESC NULLS LAST, ic.id DESC
  LIMIT GREATEST(1, LEAST(p_limit, 200));
END;
$$;

-- 8) 권한 부여
GRANT EXECUTE ON FUNCTION public.admin_self_approve() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_verifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_verification(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_invitation_code(TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_invitation_codes(INTEGER) TO authenticated;

-- PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
