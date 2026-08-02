-- 응급 의료 정보 QR 공유 (토큰 기반 공개 조회)
-- 선행: migration_v4 (is_approved_admin)

CREATE TABLE IF NOT EXISTS public.emergency_medical_shares (
  share_token TEXT PRIMARY KEY,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_emergency_medical_shares_owner
  ON public.emergency_medical_shares (owner_user_id);

ALTER TABLE public.emergency_medical_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emergency_medical_shares_admin_all" ON public.emergency_medical_shares;
CREATE POLICY "emergency_medical_shares_admin_all"
  ON public.emergency_medical_shares
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

CREATE OR REPLACE FUNCTION public.get_emergency_medical_share(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.emergency_medical_shares;
BEGIN
  SELECT * INTO v_row
  FROM public.emergency_medical_shares
  WHERE share_token = TRIM(p_token);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'share_token', v_row.share_token,
    'payload', v_row.payload,
    'updated_at', v_row.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_emergency_medical_share(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.upsert_emergency_medical_share(
  p_token TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT := TRIM(p_token);
  v_row public.emergency_medical_shares;
BEGIN
  IF LENGTH(v_token) < 16 THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  INSERT INTO public.emergency_medical_shares (share_token, owner_user_id, payload, updated_at)
  VALUES (v_token, auth.uid(), p_payload, TIMEZONE('utc'::text, NOW()))
  ON CONFLICT (share_token) DO UPDATE
  SET
    payload = EXCLUDED.payload,
    owner_user_id = COALESCE(EXCLUDED.owner_user_id, emergency_medical_shares.owner_user_id),
    updated_at = TIMEZONE('utc'::text, NOW())
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'share_token', v_row.share_token,
    'updated_at', v_row.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_emergency_medical_share(TEXT, JSONB) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
