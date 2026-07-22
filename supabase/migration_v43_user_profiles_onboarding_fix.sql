-- user_profiles 스키마 누락 컬럼 일괄 보강 + 온보딩/연동 RPC 재생성
-- 오류: column "name" of relation "user_profiles" does not exist
-- Supabase SQL Editor에서 한 번에 실행 (v11/v39/v40 미적용 DB 포함)

-- 1) 필수 컬럼 보강
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS invitation_code TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_nickname_unique_idx
  ON public.user_profiles (LOWER(TRIM(nickname)))
  WHERE nickname IS NOT NULL AND TRIM(nickname) <> '';

CREATE INDEX IF NOT EXISTS user_profiles_email_lower_idx
  ON public.user_profiles (LOWER(TRIM(email)))
  WHERE email IS NOT NULL AND TRIM(email) <> '';

-- 2) 온보딩 완료 판별
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

-- 3) 프로필 행 보장
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

  RETURN v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_my_user_profile() TO authenticated;

-- 4) 로그인 시 프로필 병합
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

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid) THEN
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

-- 5) 이메일 마스킹 / 찾기
CREATE OR REPLACE FUNCTION public.mask_email(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_local TEXT;
  v_domain TEXT;
BEGIN
  IF p_email IS NULL OR POSITION('@' IN p_email) < 2 THEN
    RETURN NULL;
  END IF;
  v_local := SPLIT_PART(p_email, '@', 1);
  v_domain := SPLIT_PART(p_email, '@', 2);
  IF LENGTH(v_local) <= 1 THEN
    RETURN '*' || '@' || v_domain;
  END IF;
  RETURN LEFT(v_local, 1) || REPEAT('*', GREATEST(LENGTH(v_local) - 1, 2)) || '@' || v_domain;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_email_hint_by_nickname(p_nickname TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_nickname TEXT := TRIM(p_nickname);
  v_email TEXT;
  v_count INT;
BEGIN
  IF v_nickname = '' THEN
    RAISE EXCEPTION 'nickname_required';
  END IF;

  SELECT COUNT(*), MIN(up.email)
  INTO v_count, v_email
  FROM public.user_profiles up
  WHERE LOWER(TRIM(up.nickname)) = LOWER(v_nickname);

  IF v_count = 0 THEN RETURN NULL; END IF;
  IF v_count > 1 THEN RAISE EXCEPTION 'ambiguous_nickname'; END IF;

  RETURN public.mask_email(v_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_email_hint_by_nickname(TEXT) TO anon, authenticated;

-- 6) 온보딩 프로필 저장
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
  v_profile public.user_profiles;
BEGIN
  v_uid := public.ensure_my_user_profile();

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
    role = v_role,
    company_name = NULLIF(TRIM(p_company_name), ''),
    profile_completed = true
  WHERE id = v_uid
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
