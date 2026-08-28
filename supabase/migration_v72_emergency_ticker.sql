-- 홈 긴급 전광판: 관리자 긴급 공지 + 공공 API 캐시
-- 선행: migration_v56, migration_v69

CREATE TABLE IF NOT EXISTS public.kemix_home_emergency_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_home_emergency_notices_active_sort
  ON public.kemix_home_emergency_notices (is_active, sort_order, created_at DESC);

ALTER TABLE public.kemix_home_emergency_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_home_emergency_notices_public_read" ON public.kemix_home_emergency_notices;
CREATE POLICY "kemix_home_emergency_notices_public_read"
  ON public.kemix_home_emergency_notices
  FOR SELECT
  USING (
    is_active = true
    AND NULLIF(TRIM(message), '') IS NOT NULL
    AND (expires_at IS NULL OR expires_at > TIMEZONE('utc'::text, NOW()))
  );

DROP POLICY IF EXISTS "kemix_home_emergency_notices_admin_all" ON public.kemix_home_emergency_notices;
CREATE POLICY "kemix_home_emergency_notices_admin_all"
  ON public.kemix_home_emergency_notices
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

CREATE TABLE IF NOT EXISTS public.kemix_disaster_ticker_cache (
  source_code TEXT PRIMARY KEY,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()) + INTERVAL '30 minutes',
  last_error TEXT
);

ALTER TABLE public.kemix_disaster_ticker_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_disaster_ticker_cache_public_read" ON public.kemix_disaster_ticker_cache;
CREATE POLICY "kemix_disaster_ticker_cache_public_read"
  ON public.kemix_disaster_ticker_cache
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "kemix_disaster_ticker_cache_service_write" ON public.kemix_disaster_ticker_cache;
CREATE POLICY "kemix_disaster_ticker_cache_service_write"
  ON public.kemix_disaster_ticker_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.list_active_emergency_ticker_messages()
RETURNS TABLE (
  message TEXT,
  source_type TEXT,
  priority INTEGER,
  sort_order INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH admin_rows AS (
    SELECT
      TRIM(n.message) AS message,
      'admin'::TEXT AS source_type,
      0 AS priority,
      n.sort_order
    FROM public.kemix_home_emergency_notices n
    WHERE n.is_active = true
      AND NULLIF(TRIM(n.message), '') IS NOT NULL
      AND (n.expires_at IS NULL OR n.expires_at > TIMEZONE('utc'::text, NOW()))
  ),
  cached_rows AS (
    SELECT
      TRIM(value::TEXT) AS message,
      CASE c.source_code
        WHEN 'weather' THEN 'weather'
        WHEN 'forest_fire' THEN 'forest_fire'
        WHEN 'disaster_sms' THEN 'disaster_sms'
        ELSE c.source_code
      END AS source_type,
      CASE c.source_code
        WHEN 'weather' THEN 100
        WHEN 'forest_fire' THEN 200
        WHEN 'disaster_sms' THEN 300
        ELSE 400
      END AS priority,
      ordinality::INTEGER AS sort_order
    FROM public.kemix_disaster_ticker_cache c
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(c.messages) = 'array' THEN c.messages
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS t(value, ordinality)
    WHERE c.expires_at > TIMEZONE('utc'::text, NOW())
      AND NULLIF(TRIM(value::TEXT), '') IS NOT NULL
  )
  SELECT * FROM admin_rows
  UNION ALL
  SELECT * FROM cached_rows
  ORDER BY priority ASC, sort_order ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_emergency_ticker_messages() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_home_emergency_notices()
RETURNS SETOF public.kemix_home_emergency_notices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.kemix_home_emergency_notices
  ORDER BY sort_order ASC, created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_home_emergency_notices() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_home_emergency_notice(
  p_id UUID DEFAULT NULL,
  p_message TEXT DEFAULT '',
  p_is_active BOOLEAN DEFAULT true,
  p_sort_order INTEGER DEFAULT 0,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.kemix_home_emergency_notices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.kemix_home_emergency_notices;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_home_emergency_notices (
      message,
      is_active,
      sort_order,
      expires_at
    ) VALUES (
      COALESCE(p_message, ''),
      COALESCE(p_is_active, true),
      COALESCE(p_sort_order, 0),
      p_expires_at
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_home_emergency_notices
    SET
      message = COALESCE(p_message, message),
      is_active = COALESCE(p_is_active, is_active),
      sort_order = COALESCE(p_sort_order, sort_order),
      expires_at = p_expires_at,
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
      RAISE EXCEPTION 'notice_not_found';
    END IF;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_home_emergency_notice(UUID, TEXT, BOOLEAN, INTEGER, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_home_emergency_notice(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    RAISE EXCEPTION 'notice_id_required';
  END IF;

  DELETE FROM public.kemix_home_emergency_notices
  WHERE id = p_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_home_emergency_notice(UUID) TO authenticated;

-- Realtime (Supabase SQL Editor 호환)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.kemix_home_emergency_notices;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.kemix_disaster_ticker_cache;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
