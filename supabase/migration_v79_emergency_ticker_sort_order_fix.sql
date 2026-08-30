-- 전광판 송출 순서: sort_order 단일 기준 정렬 (priority 타이브레이크 제거)
-- migration_v73_emergency_ticker_admin.sql 이후 SQL Editor에서 실행

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
  WITH raw AS (
    SELECT *
    FROM public.emergency_ticker_raw_items(false)
  ),
  merged AS (
    SELECT
      r.item_key,
      COALESCE(NULLIF(TRIM(s.display_message), ''), r.original_message) AS message,
      r.source_type,
      r.priority,
      COALESCE(s.sort_order, r.default_sort_order) AS sort_order,
      COALESCE(s.is_active, true) AS settings_active,
      r.notice_is_active,
      r.cache_is_expired
    FROM raw r
    LEFT JOIN public.kemix_emergency_ticker_item_settings s
      ON s.item_key = r.item_key
    WHERE COALESCE(s.is_active, true) = true
      AND r.notice_is_active = true
      AND r.cache_is_expired = false
  )
  SELECT
    merged.message,
    merged.source_type,
    merged.priority,
    merged.sort_order
  FROM merged
  WHERE NULLIF(TRIM(merged.message), '') IS NOT NULL
  ORDER BY merged.sort_order ASC, merged.item_key ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_emergency_ticker_messages() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_emergency_ticker_dashboard()
RETURNS TABLE (
  item_key TEXT,
  source_type TEXT,
  original_message TEXT,
  display_message TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  admin_notice_id UUID,
  cache_source_code TEXT,
  cache_fetched_at TIMESTAMPTZ,
  cache_expires_at TIMESTAMPTZ,
  cache_is_expired BOOLEAN,
  settings_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH raw AS (
    SELECT *
    FROM public.emergency_ticker_raw_items(true)
  )
  SELECT
    r.item_key,
    r.source_type,
    r.original_message,
    COALESCE(NULLIF(TRIM(s.display_message), ''), r.original_message) AS display_message,
    (
      r.notice_is_active
      AND COALESCE(s.is_active, true)
    ) AS is_active,
    COALESCE(s.sort_order, r.default_sort_order) AS sort_order,
    r.admin_notice_id,
    r.cache_source_code,
    r.cache_fetched_at,
    r.cache_expires_at,
    r.cache_is_expired,
    s.updated_at AS settings_updated_at
  FROM raw r
  LEFT JOIN public.kemix_emergency_ticker_item_settings s
    ON s.item_key = r.item_key
  ORDER BY COALESCE(s.sort_order, r.default_sort_order) ASC, r.item_key ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_emergency_ticker_dashboard() TO authenticated;

NOTIFY pgrst, 'reload schema';
