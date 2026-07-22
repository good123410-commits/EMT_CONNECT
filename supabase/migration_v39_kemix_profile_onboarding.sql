-- 프로필 온보딩: 별명, 연락처, 완료 여부 + 이메일 찾기/프로필 저장 RPC
-- Supabase SQL Editor에서 migration_v35 이후 실행

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_nickname_unique_idx
  ON public.user_profiles (LOWER(TRIM(nickname)))
  WHERE nickname IS NOT NULL AND TRIM(nickname) <> '';

-- 이메일 마스킹 (아이디 찾기)
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

-- 별명으로 가입 이메일 힌트 조회
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

  IF v_count = 0 THEN
    RETURN NULL;
  END IF;

  IF v_count > 1 THEN
    RAISE EXCEPTION 'ambiguous_nickname';
  END IF;

  RETURN public.mask_email(v_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_email_hint_by_nickname(TEXT) TO anon, authenticated;

-- 온보딩 프로필 저장
CREATE OR REPLACE FUNCTION public.complete_my_profile(
  p_nickname TEXT,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'user',
  p_company_name TEXT DEFAULT NULL
)
RETURNS public.user_profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
