-- migration_v80_place_votes.sql
-- 안전지도 장소 좋아요/싫어요 투표 (병원·약국·쉼터·AED·소아)
-- 선행: migration_v5 (is_approved_admin)

-- ============================================================
-- 1) Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.place_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_kind TEXT NOT NULL CHECK (place_kind IN ('aed', 'shelter', 'pharmacy', 'er', 'pediatric')),
  place_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT place_votes_user_place_unique UNIQUE (user_id, place_kind, place_id)
);

CREATE INDEX IF NOT EXISTS idx_place_votes_place
  ON public.place_votes (place_kind, place_id);

CREATE INDEX IF NOT EXISTS idx_place_votes_user
  ON public.place_votes (user_id);

-- ============================================================
-- 2) RLS — raw rows: 본인 투표만 조회, 쓰기는 RPC 전용
-- ============================================================
ALTER TABLE public.place_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "place_votes_own_read" ON public.place_votes;
CREATE POLICY "place_votes_own_read"
  ON public.place_votes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "place_votes_admin_all" ON public.place_votes;
CREATE POLICY "place_votes_admin_all"
  ON public.place_votes FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- ============================================================
-- 3) Helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_vote_summary_row(
  p_place_kind TEXT,
  p_place_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_like INTEGER := 0;
  v_dislike INTEGER := 0;
  v_my_vote TEXT;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'like')::INTEGER,
    COUNT(*) FILTER (WHERE vote_type = 'dislike')::INTEGER
  INTO v_like, v_dislike
  FROM public.place_votes
  WHERE place_kind = p_place_kind AND place_id = p_place_id;

  IF auth.uid() IS NOT NULL THEN
    SELECT vote_type INTO v_my_vote
    FROM public.place_votes
    WHERE place_kind = p_place_kind
      AND place_id = p_place_id
      AND user_id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'place_kind', p_place_kind,
    'place_id', p_place_id,
    'like_count', COALESCE(v_like, 0),
    'dislike_count', COALESCE(v_dislike, 0),
    'my_vote', v_my_vote
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_place_vote_summary(
  p_place_kind TEXT,
  p_place_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_place_kind NOT IN ('aed', 'shelter', 'pharmacy', 'er', 'pediatric') THEN
    RAISE EXCEPTION 'invalid_place_kind';
  END IF;

  IF p_place_id IS NULL OR trim(p_place_id) = '' THEN
    RAISE EXCEPTION 'invalid_place_id';
  END IF;

  RETURN public.place_vote_summary_row(p_place_kind, trim(p_place_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_place_vote_summaries(
  p_requests JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_kind TEXT;
  v_id TEXT;
  v_results JSONB := '[]'::JSONB;
BEGIN
  IF p_requests IS NULL OR jsonb_typeof(p_requests) <> 'array' THEN
    RETURN '[]'::JSONB;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_requests)
  LOOP
    v_kind := v_item->>'place_kind';
    v_id := trim(COALESCE(v_item->>'place_id', ''));

    IF v_kind IN ('aed', 'shelter', 'pharmacy', 'er', 'pediatric') AND v_id <> '' THEN
      v_results := v_results || jsonb_build_array(public.place_vote_summary_row(v_kind, v_id));
    END IF;
  END LOOP;

  RETURN v_results;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_place_vote(
  p_place_kind TEXT,
  p_place_id TEXT,
  p_vote_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing TEXT;
  v_place_id TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'login_required';
  END IF;

  IF p_place_kind NOT IN ('aed', 'shelter', 'pharmacy', 'er', 'pediatric') THEN
    RAISE EXCEPTION 'invalid_place_kind';
  END IF;

  v_place_id := trim(COALESCE(p_place_id, ''));
  IF v_place_id = '' THEN
    RAISE EXCEPTION 'invalid_place_id';
  END IF;

  IF p_vote_type NOT IN ('like', 'dislike') THEN
    RAISE EXCEPTION 'invalid_vote_type';
  END IF;

  SELECT vote_type INTO v_existing
  FROM public.place_votes
  WHERE user_id = auth.uid()
    AND place_kind = p_place_kind
    AND place_id = v_place_id
  FOR UPDATE;

  IF v_existing IS NULL THEN
    INSERT INTO public.place_votes (user_id, place_kind, place_id, vote_type)
    VALUES (auth.uid(), p_place_kind, v_place_id, p_vote_type);
  ELSIF v_existing = p_vote_type THEN
    DELETE FROM public.place_votes
    WHERE user_id = auth.uid()
      AND place_kind = p_place_kind
      AND place_id = v_place_id;
  ELSE
    UPDATE public.place_votes
    SET
      vote_type = p_vote_type,
      updated_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = auth.uid()
      AND place_kind = p_place_kind
      AND place_id = v_place_id;
  END IF;

  RETURN public.place_vote_summary_row(p_place_kind, v_place_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_place_vote_summary(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_place_vote_summaries(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_place_vote(TEXT, TEXT, TEXT) TO authenticated;
