-- 초대 코드 이메일 전송 (Edge Function 연동용 audit 확장)
-- migration_v4 실행 후 적용

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

GRANT EXECUTE ON FUNCTION public.admin_create_invitation_code(TEXT, INTEGER, TEXT) TO authenticated;
