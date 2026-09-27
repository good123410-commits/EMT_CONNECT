-- 관리자 대시보드: 발급 초대(비밀) 코드 삭제

CREATE OR REPLACE FUNCTION public.admin_delete_invitation_code(p_code_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.invitation_codes;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  SELECT * INTO v_row
  FROM public.invitation_codes
  WHERE id = p_code_id;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'invitation_code_not_found';
  END IF;

  DELETE FROM public.invitation_codes
  WHERE id = p_code_id;

  PERFORM public.write_audit_log(
    'invitation_code_deleted',
    'invitation_code',
    p_code_id::text,
    jsonb_build_object(
      'code', v_row.code,
      'target_role', v_row.target_role,
      'was_used', v_row.used_at IS NOT NULL,
      'used_by', v_row.used_by
    )
  );

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_invitation_code(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
