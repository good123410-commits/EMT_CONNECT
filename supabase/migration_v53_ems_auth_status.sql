-- EMS 인증 3단계: none → pending → code_required → verified
-- 선행: migration_v49

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS auth_status TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_auth_status_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_auth_status_check
  CHECK (auth_status IN ('none', 'pending', 'code_required', 'verified'));

UPDATE public.user_profiles
SET auth_status = 'verified'
WHERE auth_status = 'none'
  AND is_approved = true
  AND role IN (
    'associate_member', 'regular_member', 'paramedic',
    'admin', 'super_admin', 'sub_admin', 'hospital', 'private_ems'
  );

UPDATE public.user_profiles up
SET auth_status = 'pending'
FROM public.emt_verifications ev
WHERE ev.user_id = up.id
  AND ev.status = 'pending'
  AND ev.document_url IS DISTINCT FROM 'code-only'
  AND up.auth_status = 'none';

UPDATE public.user_profiles up
SET auth_status = 'code_required'
FROM public.emt_verifications ev
WHERE ev.user_id = up.id
  AND ev.status = 'approved'
  AND up.is_approved = false
  AND up.auth_status IN ('none', 'pending');

-- 자격증만 제출 (Step 1)
CREATE OR REPLACE FUNCTION public.submit_ems_verification_document(p_document_url TEXT)
RETURNS public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_doc TEXT := NULLIF(TRIM(p_document_url), '');
  v_row public.emt_verifications;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_doc IS NULL THEN
    RAISE EXCEPTION 'document_required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = v_uid AND up.auth_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'already_pending';
  END IF;

  INSERT INTO public.emt_verifications (user_id, document_url, status)
  VALUES (v_uid, v_doc, 'pending')
  RETURNING * INTO v_row;

  UPDATE public.user_profiles
  SET auth_status = 'pending'
  WHERE id = v_uid;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_ems_verification_document(TEXT) TO authenticated;

-- 비밀코드 입력 완료 (Step 3)
CREATE OR REPLACE FUNCTION public.submit_paramedic_code_request(
  p_code TEXT,
  p_document_url TEXT DEFAULT NULL
)
RETURNS public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT := UPPER(TRIM(p_code));
  v_row public.emt_verifications;
  v_invite public.invitation_codes;
  v_profile public.user_profiles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_code = '' THEN
    RAISE EXCEPTION 'code_required';
  END IF;

  SELECT * INTO v_profile FROM public.user_profiles WHERE id = v_uid;

  SELECT * INTO v_invite
  FROM public.invitation_codes ic
  WHERE UPPER(ic.code) = v_code
    AND (ic.expires_at IS NULL OR ic.expires_at > TIMEZONE('utc'::text, NOW()))
    AND ic.used_by IS NULL
  ORDER BY ic.created_at DESC
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  IF v_profile.auth_status NOT IN ('code_required', 'pending', 'none', 'verified') THEN
    RAISE EXCEPTION 'invalid_auth_state';
  END IF;

  UPDATE public.invitation_codes
  SET used_by = v_uid, used_at = TIMEZONE('utc'::text, NOW())
  WHERE id = v_invite.id AND used_by IS NULL;

  UPDATE public.user_profiles
  SET
    role = CASE
      WHEN v_invite.target_role IN ('paramedic', 'associate_member') THEN 'associate_member'
      ELSE v_invite.target_role
    END,
    is_approved = true,
    auth_status = 'verified',
    invitation_code = v_code,
    membership_dues_paid = false,
    membership_dues_paid_at = NULL
  WHERE id = v_uid;

  SELECT * INTO v_row
  FROM public.emt_verifications
  WHERE user_id = v_uid
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_row.id IS NOT NULL THEN
    UPDATE public.emt_verifications
    SET status = 'approved',
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = v_row.id
    RETURNING * INTO v_row;
  ELSE
    INSERT INTO public.emt_verifications (user_id, document_url, status)
    VALUES (v_uid, COALESCE(NULLIF(TRIM(p_document_url), ''), 'code-only'), 'approved')
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

-- 자격증 승인 시 즉시 입장 대신 비밀코드 대기
CREATE OR REPLACE FUNCTION public.admin_review_verification(
  p_verification_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_target_role TEXT DEFAULT 'associate_member'
)
RETURNS public.emt_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.emt_verifications;
  v_role TEXT := COALESCE(NULLIF(TRIM(p_target_role), ''), 'associate_member');
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
    IF v_role IN ('paramedic', 'associate_member') THEN
      v_role := 'associate_member';
    END IF;

    UPDATE public.user_profiles
    SET auth_status = 'code_required'
    WHERE id = v_row.user_id
      AND auth_status IN ('none', 'pending', 'code_required');

    IF v_role NOT IN ('paramedic', 'associate_member') THEN
      UPDATE public.user_profiles
      SET role = v_role,
          is_approved = true,
          auth_status = 'verified'
      WHERE id = v_row.user_id;
    END IF;
  ELSE
    UPDATE public.user_profiles
    SET auth_status = 'none'
    WHERE id = v_row.user_id
      AND auth_status IN ('pending', 'code_required');
  END IF;

  PERFORM public.write_audit_log(
    CASE WHEN p_status = 'approved' THEN 'verification_approved' ELSE 'verification_rejected' END,
    'verification',
    p_verification_id::text,
    jsonb_build_object('user_id', v_row.user_id, 'notes', p_notes, 'role', v_role)
  );

  RETURN v_row;
END;
$$;
