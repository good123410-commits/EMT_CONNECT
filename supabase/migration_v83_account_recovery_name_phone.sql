-- Account recovery: find masked email by legal name + phone (anon-safe RPC)

CREATE OR REPLACE FUNCTION public.mask_email(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_local TEXT;
  v_domain TEXT;
  v_visible INT;
BEGIN
  IF p_email IS NULL OR POSITION('@' IN p_email) < 2 THEN
    RETURN NULL;
  END IF;
  v_local := SPLIT_PART(p_email, '@', 1);
  v_domain := SPLIT_PART(p_email, '@', 2);
  v_visible := LEAST(2, LENGTH(v_local));
  IF v_visible <= 0 THEN
    RETURN REPEAT('*', 4) || '@' || v_domain;
  END IF;
  RETURN LEFT(v_local, v_visible)
    || REPEAT('*', GREATEST(4, LENGTH(v_local) - v_visible))
    || '@'
    || v_domain;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_phone_digits(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION public.find_email_hint_by_name_phone(p_name TEXT, p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT := TRIM(p_name);
  v_phone_norm TEXT := public.normalize_phone_digits(p_phone);
  v_email TEXT;
  v_count INT;
BEGIN
  IF v_name = '' THEN
    RAISE EXCEPTION 'name_required';
  END IF;
  IF LENGTH(v_phone_norm) < 9 THEN
    RAISE EXCEPTION 'phone_required';
  END IF;

  SELECT COUNT(*), MIN(up.email)
  INTO v_count, v_email
  FROM public.user_profiles up
  WHERE LOWER(TRIM(up.name)) = LOWER(v_name)
    AND public.normalize_phone_digits(up.phone) = v_phone_norm;

  IF v_count = 0 THEN
    RETURN NULL;
  END IF;
  IF v_count > 1 THEN
    RAISE EXCEPTION 'ambiguous_identity';
  END IF;

  RETURN public.mask_email(v_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_email_hint_by_name_phone(TEXT, TEXT) TO anon, authenticated;
