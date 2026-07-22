-- invitation_codes.created_at 누락 시 인증/초대 조회 오류(42703) 수정
-- SQL Editor에서 이 파일만 실행해도 됩니다.

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

GRANT EXECUTE ON FUNCTION public.admin_list_invitation_codes(INTEGER) TO authenticated;

NOTIFY pgrst, 'reload schema';
