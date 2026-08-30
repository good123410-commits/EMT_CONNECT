-- 전광판 항목별 관리(수정·숨김·정렬) — migration_v72 이후 실행

CREATE TABLE IF NOT EXISTS public.kemix_emergency_ticker_item_settings (
  item_key TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  original_message TEXT NOT NULL DEFAULT '',
  display_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  admin_notice_id UUID REFERENCES public.kemix_home_emergency_notices(id) ON DELETE CASCADE,
  cache_source_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_emergency_ticker_item_settings_sort
  ON public.kemix_emergency_ticker_item_settings (sort_order ASC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_kemix_emergency_ticker_item_settings_notice
  ON public.kemix_emergency_ticker_item_settings (admin_notice_id)
  WHERE admin_notice_id IS NOT NULL;

ALTER TABLE public.kemix_emergency_ticker_item_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_emergency_ticker_item_settings_admin_all"
  ON public.kemix_emergency_ticker_item_settings;
CREATE POLICY "kemix_emergency_ticker_item_settings_admin_all"
  ON public.kemix_emergency_ticker_item_settings
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

CREATE OR REPLACE FUNCTION public.emergency_ticker_admin_notice_key(p_notice_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'admin:' || p_notice_id::TEXT;
$$;

CREATE OR REPLACE FUNCTION public.emergency_ticker_cache_item_key(
  p_source_code TEXT,
  p_message TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'cache:' || TRIM(p_source_code) || ':' || md5(lower(trim(p_message)));
$$;

CREATE OR REPLACE FUNCTION public.emergency_ticker_source_priority(p_source_type TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE TRIM(p_source_type)
    WHEN 'admin' THEN 0
    WHEN 'weather' THEN 100
    WHEN 'forest_fire' THEN 200
    WHEN 'disaster_sms' THEN 300
    ELSE 400
  END;
$$;

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
  ORDER BY merged.sort_order ASC, merged.priority ASC;
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
  ORDER BY COALESCE(s.sort_order, r.default_sort_order) ASC, r.priority ASC, r.original_message ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_emergency_ticker_dashboard() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_emergency_ticker_item_setting(
  p_item_key TEXT,
  p_source_type TEXT,
  p_original_message TEXT,
  p_display_message TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true,
  p_sort_order INTEGER DEFAULT NULL,
  p_admin_notice_id UUID DEFAULT NULL,
  p_cache_source_code TEXT DEFAULT NULL
)
RETURNS public.kemix_emergency_ticker_item_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.kemix_emergency_ticker_item_settings;
  v_sort INTEGER;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF NULLIF(TRIM(p_item_key), '') IS NULL THEN
    RAISE EXCEPTION 'item_key_required';
  END IF;

  v_sort := COALESCE(
    p_sort_order,
    (
      SELECT COALESCE(MAX(sort_order), 0) + 10
      FROM public.kemix_emergency_ticker_item_settings
    ),
    0
  );

  INSERT INTO public.kemix_emergency_ticker_item_settings (
    item_key,
    source_type,
    original_message,
    display_message,
    is_active,
    sort_order,
    admin_notice_id,
    cache_source_code,
    updated_at
  ) VALUES (
    TRIM(p_item_key),
    TRIM(p_source_type),
    COALESCE(p_original_message, ''),
    NULLIF(TRIM(p_display_message), ''),
    COALESCE(p_is_active, true),
    v_sort,
    p_admin_notice_id,
    NULLIF(TRIM(p_cache_source_code), ''),
    TIMEZONE('utc'::text, NOW())
  )
  ON CONFLICT (item_key) DO UPDATE
  SET
    source_type = EXCLUDED.source_type,
    original_message = EXCLUDED.original_message,
    display_message = COALESCE(
      EXCLUDED.display_message,
      public.kemix_emergency_ticker_item_settings.display_message
    ),
    is_active = EXCLUDED.is_active,
    sort_order = COALESCE(p_sort_order, public.kemix_emergency_ticker_item_settings.sort_order),
    admin_notice_id = EXCLUDED.admin_notice_id,
    cache_source_code = EXCLUDED.cache_source_code,
    updated_at = TIMEZONE('utc'::text, NOW())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_emergency_ticker_item_setting(
  TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, UUID, TEXT
) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reorder_emergency_ticker_items(p_items JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_item_key TEXT;
  v_sort_order INTEGER;
  v_source_type TEXT;
  v_original_message TEXT;
  v_admin_notice_id UUID;
  v_cache_source_code TEXT;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'invalid_items_payload';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_item_key := NULLIF(TRIM(v_item->>'item_key'), '');
    v_sort_order := NULLIF(v_item->>'sort_order', '')::INTEGER;
    v_source_type := NULLIF(TRIM(v_item->>'source_type'), '');
    v_original_message := COALESCE(v_item->>'original_message', '');
    v_admin_notice_id := NULLIF(v_item->>'admin_notice_id', '')::UUID;
    v_cache_source_code := NULLIF(TRIM(v_item->>'cache_source_code'), '');

    IF v_item_key IS NULL OR v_sort_order IS NULL OR v_source_type IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.kemix_emergency_ticker_item_settings (
      item_key,
      source_type,
      original_message,
      is_active,
      sort_order,
      admin_notice_id,
      cache_source_code,
      updated_at
    ) VALUES (
      v_item_key,
      v_source_type,
      v_original_message,
      true,
      v_sort_order,
      v_admin_notice_id,
      v_cache_source_code,
      TIMEZONE('utc'::text, NOW())
    )
    ON CONFLICT (item_key) DO UPDATE
    SET
      sort_order = EXCLUDED.sort_order,
      updated_at = TIMEZONE('utc'::text, NOW());
  END LOOP;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reorder_emergency_ticker_items(JSONB) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime
        ADD TABLE public.kemix_emergency_ticker_item_settings;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
