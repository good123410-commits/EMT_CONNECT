-- migration_v29_kemix_content_schedules_trainings.sql
-- KEMIX 콘텐츠: 일정 달력 + 교육 안내
-- 선행: migration_v5 (is_approved_admin)

-- ============================================================
-- 1) KEMIX 일정
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tag_color TEXT NOT NULL DEFAULT '#047857',
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT kemix_schedules_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_kemix_schedules_published
  ON public.kemix_schedules (is_published, start_date);

ALTER TABLE public.kemix_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_schedules_public_read" ON public.kemix_schedules;
CREATE POLICY "kemix_schedules_public_read"
  ON public.kemix_schedules FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "kemix_schedules_admin_all" ON public.kemix_schedules;
CREATE POLICY "kemix_schedules_admin_all"
  ON public.kemix_schedules FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 2) KEMIX 교육 안내
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kemix_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  training_start DATE,
  training_end DATE,
  status TEXT NOT NULL DEFAULT 'recruiting'
    CHECK (status IN ('recruiting', 'closed', 'upcoming')),
  apply_url TEXT,
  attachment_url TEXT,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_kemix_trainings_published
  ON public.kemix_trainings (is_published, display_order, created_at DESC);

ALTER TABLE public.kemix_trainings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_trainings_public_read" ON public.kemix_trainings;
CREATE POLICY "kemix_trainings_public_read"
  ON public.kemix_trainings FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "kemix_trainings_admin_all" ON public.kemix_trainings;
CREATE POLICY "kemix_trainings_admin_all"
  ON public.kemix_trainings FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 3) 공개 RPC — 일정
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_schedules_in_range(
  p_start DATE,
  p_end DATE
)
RETURNS SETOF public.kemix_schedules
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.kemix_schedules s
  WHERE s.is_published = true
    AND s.start_date <= p_end
    AND s.end_date >= p_start
  ORDER BY s.start_date ASC, s.display_order ASC, s.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_published_schedules_in_range(DATE, DATE) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_published_schedule(p_id UUID)
RETURNS public.kemix_schedules
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.kemix_schedules
  WHERE id = p_id AND is_published = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_published_schedule(UUID) TO anon, authenticated;

-- ============================================================
-- 4) 공개 RPC — 교육
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_trainings(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.kemix_trainings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.kemix_trainings t
  WHERE t.is_published = true
    AND (p_category IS NULL OR p_category = '' OR t.category = p_category)
    AND (
      p_search IS NULL OR p_search = ''
      OR t.title ILIKE '%' || p_search || '%'
      OR COALESCE(t.excerpt, '') ILIKE '%' || p_search || '%'
      OR t.content ILIKE '%' || p_search || '%'
    )
  ORDER BY t.display_order ASC, t.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.list_published_trainings(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_published_training(p_id UUID)
RETURNS public.kemix_trainings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM public.kemix_trainings
  WHERE id = p_id AND is_published = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_published_training(UUID) TO anon, authenticated;

-- ============================================================
-- 5) 관리자 RPC — 일정
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_schedules()
RETURNS SETOF public.kemix_schedules
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.kemix_schedules
    ORDER BY start_date DESC, display_order ASC, created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_schedule(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_location TEXT DEFAULT '',
  p_description TEXT DEFAULT '',
  p_tag_color TEXT DEFAULT '#047857',
  p_is_published BOOLEAN DEFAULT false,
  p_display_order INTEGER DEFAULT 0
)
RETURNS public.kemix_schedules
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_schedules;
  v_end DATE;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  v_end := COALESCE(p_end_date, p_start_date);

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_schedules (
      title, start_date, end_date, location, description, tag_color, is_published, display_order
    ) VALUES (
      p_title, p_start_date, v_end,
      COALESCE(p_location, ''), COALESCE(p_description, ''),
      COALESCE(p_tag_color, '#047857'),
      COALESCE(p_is_published, false), COALESCE(p_display_order, 0)
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_schedules SET
      title = COALESCE(p_title, title),
      start_date = COALESCE(p_start_date, start_date),
      end_date = COALESCE(v_end, end_date),
      location = COALESCE(p_location, location),
      description = COALESCE(p_description, description),
      tag_color = COALESCE(p_tag_color, tag_color),
      is_published = COALESCE(p_is_published, is_published),
      display_order = COALESCE(p_display_order, display_order),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_schedule(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.kemix_schedules WHERE id = p_id;
END;
$$;

-- ============================================================
-- 6) 관리자 RPC — 교육
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_trainings()
RETURNS SETOF public.kemix_trainings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.kemix_trainings
    ORDER BY display_order ASC, created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_training(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'general',
  p_training_start DATE DEFAULT NULL,
  p_training_end DATE DEFAULT NULL,
  p_status TEXT DEFAULT 'recruiting',
  p_apply_url TEXT DEFAULT NULL,
  p_attachment_url TEXT DEFAULT NULL,
  p_excerpt TEXT DEFAULT NULL,
  p_content TEXT DEFAULT '',
  p_is_published BOOLEAN DEFAULT false,
  p_display_order INTEGER DEFAULT 0
)
RETURNS public.kemix_trainings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.kemix_trainings;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kemix_trainings (
      title, category, training_start, training_end, status,
      apply_url, attachment_url, excerpt, content, is_published, display_order
    ) VALUES (
      p_title, COALESCE(p_category, 'general'),
      p_training_start, p_training_end,
      COALESCE(p_status, 'recruiting'),
      p_apply_url, p_attachment_url, p_excerpt,
      COALESCE(p_content, ''), COALESCE(p_is_published, false), COALESCE(p_display_order, 0)
    ) RETURNING * INTO v_row;
  ELSE
    UPDATE public.kemix_trainings SET
      title = COALESCE(p_title, title),
      category = COALESCE(p_category, category),
      training_start = COALESCE(p_training_start, training_start),
      training_end = COALESCE(p_training_end, training_end),
      status = COALESCE(p_status, status),
      apply_url = COALESCE(p_apply_url, apply_url),
      attachment_url = COALESCE(p_attachment_url, attachment_url),
      excerpt = COALESCE(p_excerpt, excerpt),
      content = COALESCE(p_content, content),
      is_published = COALESCE(p_is_published, is_published),
      display_order = COALESCE(p_display_order, display_order),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_training(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.kemix_trainings WHERE id = p_id;
END;
$$;

NOTIFY pgrst, 'reload schema';

-- 관리자 RPC 실행 권한
GRANT EXECUTE ON FUNCTION public.admin_list_schedules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_schedule(UUID, TEXT, DATE, DATE, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_schedule(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_trainings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_training(UUID, TEXT, TEXT, DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_training(UUID) TO authenticated;
