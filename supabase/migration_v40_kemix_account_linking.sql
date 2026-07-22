-- 동일 이메일 계정 연동 시 프로필 병합 (소셜 ↔ 이메일)
-- migration_v39 이후 SQL Editor에서 실행

CREATE INDEX IF NOT EXISTS user_profiles_email_lower_idx
  ON public.user_profiles (LOWER(TRIM(email)))
  WHERE email IS NOT NULL AND TRIM(email) <> '';

CREATE OR REPLACE FUNCTION public.is_profile_onboarding_complete(p_profile public.user_profiles)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(p_profile.profile_completed, false)
    OR (
      p_profile.nickname IS NOT NULL
      AND TRIM(p_profile.nickname) <> ''
    );
$$;

-- 로그인 사용자 프로필 행 보장 + auth 이메일 동기화
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

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = v_uid) THEN
    INSERT INTO public.user_profiles (id, email, role, is_approved)
    SELECT
      p.id,
      COALESCE(u.email, v_email),
      CASE
        WHEN p.role IN ('hospital', 'paramedic', 'private_ems', 'admin') THEN p.role
        WHEN p.role = 'emt_certified' THEN 'paramedic'
        ELSE 'user'
      END,
      COALESCE(p.is_approved, false)
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.id = v_uid
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = v_uid) THEN
    RAISE EXCEPTION 'user_profile_missing';
  END IF;

  UPDATE public.user_profiles
  SET email = v_email
  WHERE id = v_uid
    AND v_email IS NOT NULL
    AND (email IS NULL OR LOWER(TRIM(email)) IS DISTINCT FROM LOWER(TRIM(v_email)));

  RETURN v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_my_user_profile() TO authenticated;

-- 로그인 직후: 동일 이메일·레거시 프로필 데이터 병합 (중복 온보딩 방지)
CREATE OR REPLACE FUNCTION public.reconcile_my_profile_on_login()
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_email TEXT;
  v_current public.user_profiles;
  v_source public.user_profiles;
BEGIN
  v_uid := public.ensure_my_user_profile();

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;

  SELECT * INTO v_current FROM public.user_profiles WHERE id = v_uid;

  IF public.is_profile_onboarding_complete(v_current) THEN
    RETURN v_current;
  END IF;

  -- 동일 auth user id 레거시 profiles 행
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid) THEN
    UPDATE public.user_profiles up
    SET
      name = COALESCE(NULLIF(TRIM(up.name), ''), p.name),
      role = CASE
        WHEN up.role = 'user' AND p.role IN ('hospital', 'paramedic', 'private_ems', 'admin', 'emt_certified')
          THEN CASE WHEN p.role = 'emt_certified' THEN 'paramedic' ELSE p.role END
        ELSE up.role
      END,
      is_approved = up.is_approved OR COALESCE(p.is_approved, false)
    FROM public.profiles p
    WHERE up.id = v_uid AND p.id = v_uid;

    SELECT * INTO v_current FROM public.user_profiles WHERE id = v_uid;
    IF public.is_profile_onboarding_complete(v_current) THEN
      RETURN v_current;
    END IF;
  END IF;

  -- 동일 이메일 다른 user_profiles (소셜·이메일 이중 가입 대비)
  IF v_email IS NOT NULL AND TRIM(v_email) <> '' THEN
    SELECT up.* INTO v_source
    FROM public.user_profiles up
    WHERE LOWER(TRIM(up.email)) = LOWER(TRIM(v_email))
      AND up.id <> v_uid
      AND public.is_profile_onboarding_complete(up)
    ORDER BY up.profile_completed DESC, up.created_at ASC
    LIMIT 1;

    IF v_source.id IS NOT NULL THEN
      UPDATE public.user_profiles
      SET
        nickname = COALESCE(NULLIF(TRIM(nickname), ''), v_source.nickname),
        name = COALESCE(NULLIF(TRIM(name), ''), v_source.name),
        phone = COALESCE(NULLIF(TRIM(phone), ''), v_source.phone),
        company_name = COALESCE(NULLIF(TRIM(company_name), ''), v_source.company_name),
        role = CASE
          WHEN role = 'user' AND v_source.role NOT IN ('user') THEN v_source.role
          ELSE role
        END,
        is_approved = is_approved OR v_source.is_approved,
        profile_completed = true
      WHERE id = v_uid
      RETURNING * INTO v_current;

      RETURN v_current;
    END IF;
  END IF;

  RETURN v_current;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reconcile_my_profile_on_login() TO authenticated;

NOTIFY pgrst, 'reload schema';
