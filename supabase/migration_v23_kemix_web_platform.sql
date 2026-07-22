-- KEMIX 웹 플랫폼: 모금 계좌, 이달의 인터뷰, FAQ, 가이드 요청
-- 선행: migration_v5 (is_approved_admin)

-- ============================================================
-- 1) 모금 계좌
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_donation_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_donation_accounts_active
  ON public.kemix_donation_accounts (is_active, display_order);

ALTER TABLE public.kemix_donation_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_donation_accounts_public_read" ON public.kemix_donation_accounts;
CREATE POLICY "kemix_donation_accounts_public_read"
  ON public.kemix_donation_accounts FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "kemix_donation_accounts_admin_all" ON public.kemix_donation_accounts;
CREATE POLICY "kemix_donation_accounts_admin_all"
  ON public.kemix_donation_accounts FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 2) 이달의 인터뷰
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_monthly_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  interviewee_name TEXT NOT NULL,
  interviewee_role TEXT,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  published_month TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_interviews_published
  ON public.kemix_monthly_interviews (is_published, published_month DESC);

ALTER TABLE public.kemix_monthly_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_interviews_public_read" ON public.kemix_monthly_interviews;
CREATE POLICY "kemix_interviews_public_read"
  ON public.kemix_monthly_interviews FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "kemix_interviews_admin_all" ON public.kemix_monthly_interviews;
CREATE POLICY "kemix_interviews_admin_all"
  ON public.kemix_monthly_interviews FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 3) FAQ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_faqs_published
  ON public.kemix_faqs (is_published, display_order);

ALTER TABLE public.kemix_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_faqs_public_read" ON public.kemix_faqs;
CREATE POLICY "kemix_faqs_public_read"
  ON public.kemix_faqs FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "kemix_faqs_admin_all" ON public.kemix_faqs;
CREATE POLICY "kemix_faqs_admin_all"
  ON public.kemix_faqs FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 4) 가이드 요청 (웹 사용자)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_guide_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.kemix_guide_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_guide_requests_auth_insert" ON public.kemix_guide_requests;
CREATE POLICY "kemix_guide_requests_auth_insert"
  ON public.kemix_guide_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "kemix_guide_requests_own_read" ON public.kemix_guide_requests;
CREATE POLICY "kemix_guide_requests_own_read"
  ON public.kemix_guide_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_approved_admin());

DROP POLICY IF EXISTS "kemix_guide_requests_admin_all" ON public.kemix_guide_requests;
CREATE POLICY "kemix_guide_requests_admin_all"
  ON public.kemix_guide_requests FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 5) 공개 RPC — 모금 계좌
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_active_donation_accounts()
RETURNS SETOF public.kemix_donation_accounts
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_donation_accounts
  WHERE is_active = true
  ORDER BY display_order ASC, created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_donation_accounts() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_donation_accounts()
RETURNS SETOF public.kemix_donation_accounts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.kemix_donation_accounts
    ORDER BY display_order ASC, created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_donation_account(
  p_id UUID DEFAULT NULL,
  p_bank_name TEXT DEFAULT NULL,
  p_account_number TEXT DEFAULT NULL,
  p_account_holder TEXT DEFAULT NULL,
  p_purpose TEXT DEFAULT '',
  p_display_order INTEGER DEFAULT 0,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS public.kemix_donation_accounts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_donation_accounts;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_donation_accounts (
      bank_name, account_number, account_holder, purpose, display_order, is_active
    ) VALUES (
      p_bank_name, p_account_number, p_account_holder, COALESCE(p_purpose, ''),
      COALESCE(p_display_order, 0), COALESCE(p_is_active, true)
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_donation_accounts SET
      bank_name = COALESCE(p_bank_name, bank_name),
      account_number = COALESCE(p_account_number, account_number),
      account_holder = COALESCE(p_account_holder, account_holder),
      purpose = COALESCE(p_purpose, purpose),
      display_order = COALESCE(p_display_order, display_order),
      is_active = COALESCE(p_is_active, is_active),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_donation_account(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.kemix_donation_accounts WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- 6) 공개 RPC — 이달의 인터뷰
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_interviews(p_limit INTEGER DEFAULT 12)
RETURNS SETOF public.kemix_monthly_interviews
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_monthly_interviews
  WHERE is_published = true
  ORDER BY published_month DESC, created_at DESC
  LIMIT COALESCE(p_limit, 12);
$$;

GRANT EXECUTE ON FUNCTION public.list_published_interviews(INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_featured_interview()
RETURNS public.kemix_monthly_interviews
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_monthly_interviews
  WHERE is_published = true
  ORDER BY published_month DESC, created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_featured_interview() TO anon, authenticated;

-- ============================================================
-- 7) 공개 RPC — FAQ
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_faqs()
RETURNS SETOF public.kemix_faqs
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_faqs
  WHERE is_published = true
  ORDER BY display_order ASC, created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_published_faqs() TO anon, authenticated;

-- ============================================================
-- 8) 시드 데이터 (모금 계좌 예시)
-- ============================================================
INSERT INTO public.kemix_donation_accounts (bank_name, account_number, account_holder, purpose, display_order, is_active)
SELECT '국민은행', '123-456-789012', '사단법인 케믹스', '응급구조사 교육·장비 지원 모금', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.kemix_donation_accounts LIMIT 1);

NOTIFY pgrst, 'reload schema';
