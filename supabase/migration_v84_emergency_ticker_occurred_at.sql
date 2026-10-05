-- 전광판 항목별 발생·수신 시각 (상세 보기용)
-- RETURNS TABLE 컬럼 변경 시 CREATE OR REPLACE 불가 → 선행 DROP 필요

DROP FUNCTION IF EXISTS public.list_active_emergency_ticker_messages();
DROP FUNCTION IF EXISTS public.emergency_ticker_raw_items(boolean);

CREATE OR REPLACE FUNCTION public.emergency_ticker_raw_items(p_include_expired_cache BOOLEAN DEFAULT false)
RETURNS TABLE (
  item_key TEXT,
  source_type TEXT,
  original_message TEXT,
  default_sort_order INTEGER,
  priority INTEGER,
  admin_notice_id UUID,
  cache_source_code TEXT,
  notice_is_active BOOLEAN,
  notice_created_at TIMESTAMPTZ,
  cache_fetched_at TIMESTAMPTZ,
  cache_expires_at TIMESTAMPTZ,
  cache_is_expired BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH admin_rows AS (
    SELECT
      public.emergency_ticker_admin_notice_key(n.id) AS item_key,
      'admin'::TEXT AS source_type,
      TRIM(n.message) AS original_message,
      (n.sort_order * 10) AS default_sort_order,
      public.emergency_ticker_source_priority('admin') AS priority,
      n.id AS admin_notice_id,
      NULL::TEXT AS cache_source_code,
      n.is_active AS notice_is_active,
      n.created_at AS notice_created_at,
      NULL::TIMESTAMPTZ AS cache_fetched_at,
      NULL::TIMESTAMPTZ AS cache_expires_at,
      false AS cache_is_expired
    FROM public.kemix_home_emergency_notices n
    WHERE NULLIF(TRIM(n.message), '') IS NOT NULL
  ),
  cached_rows AS (
    SELECT
      public.emergency_ticker_cache_item_key(c.source_code, value::TEXT) AS item_key,
      CASE c.source_code
        WHEN 'weather' THEN 'weather'
        WHEN 'forest_fire' THEN 'forest_fire'
        WHEN 'disaster_sms' THEN 'disaster_sms'
        ELSE c.source_code
      END AS source_type,
      TRIM(value::TEXT) AS original_message,
      (
        public.emergency_ticker_source_priority(
          CASE c.source_code
            WHEN 'weather' THEN 'weather'
            WHEN 'forest_fire' THEN 'forest_fire'
            WHEN 'disaster_sms' THEN 'disaster_sms'
            ELSE c.source_code
          END
        ) * 1000 + ordinality::INTEGER
      ) AS default_sort_order,
      public.emergency_ticker_source_priority(
        CASE c.source_code
          WHEN 'weather' THEN 'weather'
          WHEN 'forest_fire' THEN 'forest_fire'
          WHEN 'disaster_sms' THEN 'disaster_sms'
          ELSE c.source_code
        END
      ) AS priority,
      NULL::UUID AS admin_notice_id,
      c.source_code AS cache_source_code,
      true AS notice_is_active,
      NULL::TIMESTAMPTZ AS notice_created_at,
      c.fetched_at AS cache_fetched_at,
      c.expires_at AS cache_expires_at,
      (c.expires_at <= TIMEZONE('utc'::text, NOW())) AS cache_is_expired
    FROM public.kemix_disaster_ticker_cache c
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(c.messages) = 'array' THEN c.messages
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS t(value, ordinality)
    WHERE NULLIF(TRIM(value::TEXT), '') IS NOT NULL
      AND (
        p_include_expired_cache
        OR c.expires_at > TIMEZONE('utc'::text, NOW())
      )
  )
  SELECT * FROM admin_rows
  UNION ALL
  SELECT * FROM cached_rows;
$$;

CREATE OR REPLACE FUNCTION public.list_active_emergency_ticker_messages()
RETURNS TABLE (
  message TEXT,
  source_type TEXT,
  priority INTEGER,
  sort_order INTEGER,
  occurred_at TIMESTAMPTZ
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
      r.cache_is_expired,
      COALESCE(r.notice_created_at, r.cache_fetched_at) AS occurred_at
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
    merged.sort_order,
    merged.occurred_at
  FROM merged
  WHERE NULLIF(TRIM(merged.message), '') IS NOT NULL
  ORDER BY merged.sort_order ASC, merged.item_key ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_emergency_ticker_messages() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
