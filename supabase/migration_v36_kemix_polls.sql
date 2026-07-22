-- migration_v36_kemix_polls.sql
-- KEMIX 커뮤니티 투표 (polls / poll_options / poll_votes)
-- 선행: migration_v5 (is_approved_admin)

-- ============================================================
-- 1) Tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  ends_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_polls_published
  ON public.polls (is_published, is_closed, display_order, created_at DESC);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll
  ON public.poll_options (poll_id, display_order);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT poll_votes_poll_user_unique UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll
  ON public.poll_votes (poll_id);

-- ============================================================
-- 2) RLS
-- ============================================================
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "polls_public_read" ON public.polls;
CREATE POLICY "polls_public_read"
  ON public.polls FOR SELECT
  USING (is_published = true OR public.is_approved_admin());

DROP POLICY IF EXISTS "polls_admin_all" ON public.polls;
CREATE POLICY "polls_admin_all"
  ON public.polls FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

DROP POLICY IF EXISTS "poll_options_public_read" ON public.poll_options;
CREATE POLICY "poll_options_public_read"
  ON public.poll_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_options.poll_id
        AND (p.is_published = true OR public.is_approved_admin())
    )
  );

DROP POLICY IF EXISTS "poll_options_admin_all" ON public.poll_options;
CREATE POLICY "poll_options_admin_all"
  ON public.poll_options FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

DROP POLICY IF EXISTS "poll_votes_admin_all" ON public.poll_votes;
CREATE POLICY "poll_votes_admin_all"
  ON public.poll_votes FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

DROP POLICY IF EXISTS "poll_votes_own_read" ON public.poll_votes;
CREATE POLICY "poll_votes_own_read"
  ON public.poll_votes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 3) Helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.poll_is_votable(p_poll public.polls)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NOT p_poll.is_closed, false)
    AND (p_poll.ends_at IS NULL OR p_poll.ends_at > TIMEZONE('utc'::text, NOW()));
$$;

CREATE OR REPLACE FUNCTION public.poll_row_to_json(p_poll_id UUID, p_include_unpublished BOOLEAN DEFAULT false)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.polls;
  v_options JSONB;
  v_total INTEGER;
  v_my_option UUID;
BEGIN
  SELECT * INTO v_poll FROM public.polls WHERE id = p_poll_id;
  IF v_poll.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT p_include_unpublished AND v_poll.is_published IS NOT TRUE THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', po.id,
      'poll_id', po.poll_id,
      'label', po.label,
      'display_order', po.display_order,
      'vote_count', COALESCE(vc.cnt, 0)
    )
    ORDER BY po.display_order ASC, po.created_at ASC
  ), '[]'::jsonb)
  INTO v_options
  FROM public.poll_options po
  LEFT JOIN (
    SELECT option_id, COUNT(*)::INTEGER AS cnt
    FROM public.poll_votes
    WHERE poll_id = p_poll_id
    GROUP BY option_id
  ) vc ON vc.option_id = po.id
  WHERE po.poll_id = p_poll_id;

  SELECT COUNT(*)::INTEGER INTO v_total
  FROM public.poll_votes
  WHERE poll_id = p_poll_id;

  IF auth.uid() IS NOT NULL THEN
    SELECT option_id INTO v_my_option
    FROM public.poll_votes
    WHERE poll_id = p_poll_id AND user_id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'id', v_poll.id,
    'title', v_poll.title,
    'description', v_poll.description,
    'is_published', v_poll.is_published,
    'is_closed', v_poll.is_closed,
    'ends_at', v_poll.ends_at,
    'closed_at', v_poll.closed_at,
    'display_order', v_poll.display_order,
    'created_at', v_poll.created_at,
    'updated_at', v_poll.updated_at,
    'is_votable', public.poll_is_votable(v_poll),
    'total_votes', v_total,
    'my_vote_option_id', v_my_option,
    'options', v_options
  );
END;
$$;

-- ============================================================
-- 4) Public RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_published_polls()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
  v_row RECORD;
BEGIN
  FOR v_row IN
    SELECT id
    FROM public.polls
    WHERE is_published = true
    ORDER BY display_order ASC, created_at DESC
  LOOP
    v_result := v_result || jsonb_build_array(public.poll_row_to_json(v_row.id, false));
  END LOOP;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_published_polls() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_published_poll(p_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.poll_row_to_json(p_id, false);
$$;

GRANT EXECUTE ON FUNCTION public.get_published_poll(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  p_poll_id UUID,
  p_option_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.polls;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'login_required';
  END IF;

  SELECT * INTO v_poll FROM public.polls WHERE id = p_poll_id AND is_published = true;
  IF v_poll.id IS NULL THEN
    RAISE EXCEPTION 'poll_not_found';
  END IF;

  IF NOT public.poll_is_votable(v_poll) THEN
    RAISE EXCEPTION 'poll_closed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.poll_options
    WHERE id = p_option_id AND poll_id = p_poll_id
  ) THEN
    RAISE EXCEPTION 'invalid_option';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.poll_votes
    WHERE poll_id = p_poll_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already_voted';
  END IF;

  INSERT INTO public.poll_votes (poll_id, option_id, user_id)
  VALUES (p_poll_id, p_option_id, auth.uid());

  RETURN public.poll_row_to_json(p_poll_id, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_poll_vote(UUID, UUID) TO authenticated;

-- ============================================================
-- 5) Admin RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_polls()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
  v_row RECORD;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  FOR v_row IN
    SELECT id FROM public.polls ORDER BY display_order ASC, created_at DESC
  LOOP
    v_result := v_result || jsonb_build_array(public.poll_row_to_json(v_row.id, true));
  END LOOP;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_polls() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_poll(
  p_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_is_published BOOLEAN DEFAULT false,
  p_ends_at TIMESTAMPTZ DEFAULT NULL,
  p_display_order INTEGER DEFAULT 0,
  p_options JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.polls;
  v_option JSONB;
  v_option_id UUID;
  v_label TEXT;
  v_order INTEGER;
  v_kept_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  IF TRIM(COALESCE(p_title, '')) = '' THEN
    RAISE EXCEPTION 'required_fields_missing';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.polls (title, description, is_published, ends_at, display_order, created_by)
    VALUES (
      TRIM(p_title),
      COALESCE(p_description, ''),
      COALESCE(p_is_published, false),
      p_ends_at,
      COALESCE(p_display_order, 0),
      auth.uid()
    )
    RETURNING * INTO v_poll;
  ELSE
    UPDATE public.polls
    SET
      title = TRIM(p_title),
      description = COALESCE(p_description, ''),
      is_published = COALESCE(p_is_published, false),
      ends_at = p_ends_at,
      display_order = COALESCE(p_display_order, 0),
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_id
    RETURNING * INTO v_poll;

    IF v_poll.id IS NULL THEN
      RAISE EXCEPTION 'poll_not_found';
    END IF;
  END IF;

  FOR v_option IN SELECT * FROM jsonb_array_elements(COALESCE(p_options, '[]'::jsonb))
  LOOP
    v_label := TRIM(COALESCE(v_option->>'label', ''));
    IF v_label = '' THEN
      CONTINUE;
    END IF;

    v_order := COALESCE((v_option->>'display_order')::INTEGER, 0);
    v_option_id := NULLIF(v_option->>'id', '')::UUID;

    IF v_option_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.poll_options WHERE id = v_option_id AND poll_id = v_poll.id
    ) THEN
      UPDATE public.poll_options
      SET label = v_label, display_order = v_order
      WHERE id = v_option_id;
      v_kept_ids := array_append(v_kept_ids, v_option_id);
    ELSE
      INSERT INTO public.poll_options (poll_id, label, display_order)
      VALUES (v_poll.id, v_label, v_order)
      RETURNING id INTO v_option_id;
      v_kept_ids := array_append(v_kept_ids, v_option_id);
    END IF;
  END LOOP;

  DELETE FROM public.poll_options
  WHERE poll_id = v_poll.id
    AND (cardinality(v_kept_ids) = 0 OR id <> ALL(v_kept_ids));

  RETURN public.poll_row_to_json(v_poll.id, true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_poll(UUID, TEXT, TEXT, BOOLEAN, TIMESTAMPTZ, INTEGER, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_poll(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.polls WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'poll_not_found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_poll(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_close_poll(p_id UUID, p_closed BOOLEAN DEFAULT true)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.polls;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  UPDATE public.polls
  SET
    is_closed = COALESCE(p_closed, true),
    closed_at = CASE WHEN COALESCE(p_closed, true) THEN TIMEZONE('utc'::text, NOW()) ELSE NULL END,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_id
  RETURNING * INTO v_poll;

  IF v_poll.id IS NULL THEN
    RAISE EXCEPTION 'poll_not_found';
  END IF;

  RETURN public.poll_row_to_json(v_poll.id, true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_close_poll(UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
