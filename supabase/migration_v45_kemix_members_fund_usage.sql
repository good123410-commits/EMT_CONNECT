-- KEMIX 회원 목록 공개 RPC + 기금 사용 안내 게시판
-- 선행: migration_v35 (member roles), migration_v5 (is_approved_admin)

-- ============================================================
-- 1) 공개 회원 목록 (정회원 · 준회원)
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_public_members()
RETURNS TABLE (
  id UUID,
  nickname TEXT,
  name TEXT,
  company_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    up.id,
    up.nickname,
    up.name,
    up.company_name,
    up.role,
    up.created_at
  FROM public.user_profiles up
  WHERE up.role IN ('regular_member', 'associate_member')
    AND COALESCE(up.is_blocked, false) = false
  ORDER BY
    CASE up.role WHEN 'regular_member' THEN 0 WHEN 'associate_member' THEN 1 ELSE 2 END,
    up.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_public_members() TO anon, authenticated;

-- ============================================================
-- 2) 기금 사용 안내
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_fund_usage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  summary TEXT,
  amount_used NUMERIC,
  receipt_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_fund_usage_reports_published
  ON public.kemix_fund_usage_reports (is_published, created_at DESC);

ALTER TABLE public.kemix_fund_usage_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_fund_usage_reports_public_read" ON public.kemix_fund_usage_reports;
CREATE POLICY "kemix_fund_usage_reports_public_read"
  ON public.kemix_fund_usage_reports FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "kemix_fund_usage_reports_admin_all" ON public.kemix_fund_usage_reports;
CREATE POLICY "kemix_fund_usage_reports_admin_all"
  ON public.kemix_fund_usage_reports FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 3) 공개 RPC — 기금 사용 안내
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_fund_usage_reports(p_limit INTEGER DEFAULT 100)
RETURNS SETOF public.kemix_fund_usage_reports
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.kemix_fund_usage_reports
  WHERE is_published = true
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 200));
$$;

GRANT EXECUTE ON FUNCTION public.list_published_fund_usage_reports(INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_fund_usage_report(p_id UUID)
RETURNS public.kemix_fund_usage_reports
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_fund_usage_reports;
BEGIN
  SELECT * INTO v_row
  FROM public.kemix_fund_usage_reports
  WHERE id = p_id AND is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_fund_usage_report(UUID) TO anon, authenticated;

-- ============================================================
-- 4) 관리자 RPC — 기금 사용 안내 CRUD
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_fund_usage_reports()
RETURNS SETOF public.kemix_fund_usage_reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.kemix_fund_usage_reports
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_fund_usage_reports() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_fund_usage_report(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_content TEXT DEFAULT '',
  p_summary TEXT DEFAULT NULL,
  p_amount_used NUMERIC DEFAULT NULL,
  p_receipt_image_url TEXT DEFAULT NULL,
  p_is_published BOOLEAN DEFAULT true
)
RETURNS public.kemix_fund_usage_reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_fund_usage_reports;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_fund_usage_reports (
      title, content, summary, amount_used, receipt_image_url, is_published
    ) VALUES (
      p_title,
      COALESCE(p_content, ''),
      NULLIF(TRIM(p_summary), ''),
      p_amount_used,
      NULLIF(TRIM(p_receipt_image_url), ''),
      COALESCE(p_is_published, true)
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_fund_usage_reports SET
      title = COALESCE(p_title, title),
      content = COALESCE(p_content, content),
      summary = COALESCE(NULLIF(TRIM(p_summary), ''), summary),
      amount_used = COALESCE(p_amount_used, amount_used),
      receipt_image_url = COALESCE(NULLIF(TRIM(p_receipt_image_url), ''), receipt_image_url),
      is_published = COALESCE(p_is_published, is_published),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_fund_usage_report(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_fund_usage_report(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.kemix_fund_usage_reports WHERE id = p_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_fund_usage_report(UUID) TO authenticated;
