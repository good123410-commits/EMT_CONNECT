-- 관리자 역할 보존 + 플랫폼 관리자 계정 부트스트랩
-- migration_v43 이후 SQL Editor에서 실행

CREATE OR REPLACE FUNCTION public.is_admin_tier_role(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(COALESCE(p_role, '')) IN ('admin', 'super_admin', 'sub_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_bootstrap_admin_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LOWER(TRIM(COALESCE(p_email, ''))) IN (
    'good1285@good1285.com'
  );
$$;

-- 프로필 행 보장 + 관리자 이메일 자동 승격
CREATE OR REPLACE FUNCTION public.ensure_my_user_profile()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;

  INSERT INTO public.user_profiles (id, email, role, is_approved)
  VALUES (v_uid, v_email, 'user', false)
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AND NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = v_uid) THEN
    INSERT INTO public.user_profiles (id, email, role, is_approved, name)
    SELECT
      p.id,
      COALESCE(u.email, v_email),
      CASE
        WHEN p.role IN ('hospital', 'paramedic', 'private_ems', 'admin') THEN p.role
        WHEN p.role = 'emt_certified' THEN 'paramedic'
        ELSE 'user'
      END,
      COALESCE(p.is_approved, false),
      p.name
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.id = v_uid
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = v_uid) THEN
    RAISE EXCEPTION 'user_profile_missing';
  END IF;

  IF v_email IS NOT NULL THEN
    UPDATE public.user_profiles
    SET email = v_email
    WHERE id = v_uid
      AND (email IS NULL OR LOWER(TRIM(email)) IS DISTINCT FROM LOWER(TRIM(v_email)));
  END IF;

  -- 플랫폼 관리자 이메일: 최고관리자 + 승인 보장
  IF public.is_bootstrap_admin_email(v_email) THEN
    UPDATE public.user_profiles
    SET
      role = CASE
        WHEN public.is_admin_tier_role(role) THEN role
        ELSE 'super_admin'
      END,
      is_approved = true
    WHERE id = v_uid;
  END IF;

  RETURN v_uid;
END;
$$;

-- 온보딩 저장 시 관리자 역할 유지 (직군 선택으로 admin 강등 방지)
CREATE OR REPLACE FUNCTION public.complete_my_profile(
  p_nickname TEXT,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'user',
  p_company_name TEXT DEFAULT NULL
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_nickname TEXT := TRIM(p_nickname);
  v_role TEXT := TRIM(p_role);
  v_email TEXT;
  v_current_role TEXT;
  v_profile public.user_profiles;
BEGIN
  v_uid := public.ensure_my_user_profile();

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;
  SELECT role INTO v_current_role FROM public.user_profiles WHERE id = v_uid;

  IF v_nickname = '' THEN
    RAISE EXCEPTION 'nickname_required';
  END IF;

  IF LENGTH(v_nickname) < 2 OR LENGTH(v_nickname) > 20 THEN
    RAISE EXCEPTION 'nickname_length_invalid';
  END IF;

  IF v_role NOT IN ('user', 'hospital', 'paramedic', 'private_ems') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE LOWER(TRIM(up.nickname)) = LOWER(v_nickname)
      AND up.id <> v_uid
  ) THEN
    RAISE EXCEPTION 'nickname_taken';
  END IF;

  UPDATE public.user_profiles
  SET
    nickname = v_nickname,
    name = NULLIF(TRIM(p_name), ''),
    phone = NULLIF(TRIM(p_phone), ''),
    role = CASE
      WHEN public.is_admin_tier_role(v_current_role) THEN v_current_role
      WHEN public.is_bootstrap_admin_email(v_email) THEN COALESCE(NULLIF(v_current_role, 'user'), 'super_admin')
      ELSE v_role
    END,
    company_name = NULLIF(TRIM(p_company_name), ''),
    profile_completed = true,
    is_approved = CASE
      WHEN public.is_bootstrap_admin_email(v_email) OR public.is_admin_tier_role(v_current_role) THEN true
      ELSE is_approved
    END
  WHERE id = v_uid
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

-- 기존 관리자 계정 복구
UPDATE public.user_profiles up
SET
  role = 'super_admin',
  is_approved = true,
  profile_completed = COALESCE(up.profile_completed, false)
FROM auth.users u
WHERE up.id = u.id
  AND LOWER(TRIM(u.email)) = 'good1285@good1285.com';

NOTIFY pgrst, 'reload schema';
