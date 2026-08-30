-- 채팅 메시지 리액션 (우리동네토크 · EMS 소통창)
-- migration_v73 이후 SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS public.kemix_chat_message_reactions (
  message_context TEXT NOT NULL CHECK (message_context IN ('local_community', 'ems_chat')),
  message_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'confirm', 'helpful', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  PRIMARY KEY (user_id, message_context, message_id)
);

CREATE INDEX IF NOT EXISTS idx_kemix_chat_message_reactions_message
  ON public.kemix_chat_message_reactions (message_context, message_id);

ALTER TABLE public.kemix_chat_message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_chat_message_reactions_read" ON public.kemix_chat_message_reactions;
CREATE POLICY "kemix_chat_message_reactions_read"
  ON public.kemix_chat_message_reactions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "kemix_chat_message_reactions_own_write" ON public.kemix_chat_message_reactions;
CREATE POLICY "kemix_chat_message_reactions_own_write"
  ON public.kemix_chat_message_reactions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.chat_message_exists(
  p_message_context TEXT,
  p_message_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_message_context = 'local_community' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.local_community_messages m
      WHERE m.id = p_message_id
        AND m.is_blinded = false
    );
  END IF;

  IF p_message_context = 'ems_chat' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.ems_community_posts p
      WHERE p.id = p_message_id
        AND p.post_type = 'chat'
        AND p.is_hidden = false
    );
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_chat_message_reaction(
  p_message_context TEXT,
  p_message_id UUID,
  p_reaction TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_reaction TEXT := TRIM(p_reaction);
  v_existing TEXT;
  v_counts JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_message_context NOT IN ('local_community', 'ems_chat') THEN
    RAISE EXCEPTION 'invalid_message_context';
  END IF;

  IF v_reaction NOT IN ('like', 'confirm', 'helpful', 'dislike') THEN
    RAISE EXCEPTION 'invalid_reaction';
  END IF;

  IF NOT public.chat_message_exists(p_message_context, p_message_id) THEN
    RAISE EXCEPTION 'message_not_found';
  END IF;

  SELECT reaction INTO v_existing
  FROM public.kemix_chat_message_reactions
  WHERE user_id = v_uid
    AND message_context = p_message_context
    AND message_id = p_message_id;

  IF v_existing = v_reaction THEN
    DELETE FROM public.kemix_chat_message_reactions
    WHERE user_id = v_uid
      AND message_context = p_message_context
      AND message_id = p_message_id;
    v_existing := NULL;
  ELSIF v_existing IS NOT NULL THEN
    UPDATE public.kemix_chat_message_reactions
    SET reaction = v_reaction,
        created_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = v_uid
      AND message_context = p_message_context
      AND message_id = p_message_id;
    v_existing := v_reaction;
  ELSE
    INSERT INTO public.kemix_chat_message_reactions (
      message_context,
      message_id,
      user_id,
      reaction
    ) VALUES (
      p_message_context,
      p_message_id,
      v_uid,
      v_reaction
    );
    v_existing := v_reaction;
  END IF;

  SELECT COALESCE(
    jsonb_object_agg(reaction, cnt),
    '{}'::jsonb
  )
  INTO v_counts
  FROM (
    SELECT reaction, COUNT(*)::INTEGER AS cnt
    FROM public.kemix_chat_message_reactions
    WHERE message_context = p_message_context
      AND message_id = p_message_id
    GROUP BY reaction
  ) grouped;

  RETURN jsonb_build_object(
    'message_id', p_message_id,
    'my_reaction', v_existing,
    'counts', v_counts
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_chat_message_reaction(TEXT, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_room_chat_reaction_summaries(
  p_message_context TEXT,
  p_room_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF p_message_context NOT IN ('local_community', 'ems_chat') THEN
    RAISE EXCEPTION 'invalid_message_context';
  END IF;

  IF p_message_context = 'local_community' THEN
  WITH room_messages AS (
    SELECT m.id
    FROM public.local_community_messages m
    WHERE m.room_id = p_room_id
      AND m.is_blinded = false
  ),
  counts AS (
    SELECT
      r.message_id,
      jsonb_object_agg(r.reaction, r.cnt) AS counts
    FROM (
      SELECT message_id, reaction, COUNT(*)::INTEGER AS cnt
      FROM public.kemix_chat_message_reactions
      WHERE message_context = p_message_context
        AND message_id IN (SELECT id FROM room_messages)
      GROUP BY message_id, reaction
    ) r
    GROUP BY r.message_id
  ),
  mine AS (
    SELECT message_id, reaction AS my_reaction
    FROM public.kemix_chat_message_reactions
    WHERE message_context = p_message_context
      AND user_id = v_uid
      AND message_id IN (SELECT id FROM room_messages)
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'message_id', rm.id,
        'counts', COALESCE(c.counts, '{}'::jsonb),
        'my_reaction', m.my_reaction
      )
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM room_messages rm
  LEFT JOIN counts c ON c.message_id = rm.id
  LEFT JOIN mine m ON m.message_id = rm.id;

  ELSE
  WITH room_messages AS (
    SELECT p.id
    FROM public.ems_community_posts p
    WHERE p.room_id = p_room_id::TEXT
      AND p.post_type = 'chat'
      AND p.is_hidden = false
  ),
  counts AS (
    SELECT
      r.message_id,
      jsonb_object_agg(r.reaction, r.cnt) AS counts
    FROM (
      SELECT message_id, reaction, COUNT(*)::INTEGER AS cnt
      FROM public.kemix_chat_message_reactions
      WHERE message_context = p_message_context
        AND message_id IN (SELECT id FROM room_messages)
      GROUP BY message_id, reaction
    ) r
    GROUP BY r.message_id
  ),
  mine AS (
    SELECT message_id, reaction AS my_reaction
    FROM public.kemix_chat_message_reactions
    WHERE message_context = p_message_context
      AND user_id = v_uid
      AND message_id IN (SELECT id FROM room_messages)
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'message_id', rm.id,
        'counts', COALESCE(c.counts, '{}'::jsonb),
        'my_reaction', m.my_reaction
      )
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM room_messages rm
  LEFT JOIN counts c ON c.message_id = rm.id
  LEFT JOIN mine m ON m.message_id = rm.id;
  END IF;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_room_chat_reaction_summaries(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_room_chat_reaction_summaries(TEXT, UUID) TO anon;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.kemix_chat_message_reactions;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
