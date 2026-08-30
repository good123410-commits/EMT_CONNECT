-- 채팅 리액션 이모티콘 확장 — migration_v74 이후 실행
-- 순서 중요: CHECK 제약을 먼저 제거한 뒤 데이터 마이그레이션

ALTER TABLE public.kemix_chat_message_reactions
  DROP CONSTRAINT IF EXISTS kemix_chat_message_reactions_reaction_check;

UPDATE public.kemix_chat_message_reactions
SET reaction = 'thumbs_up'
WHERE reaction = 'like';

ALTER TABLE public.kemix_chat_message_reactions
  ADD CONSTRAINT kemix_chat_message_reactions_reaction_check
  CHECK (
    reaction IN (
      'heart',
      'thumbs_up',
      'blue_heart',
      'laugh',
      'wow',
      'pleading',
      'confirm',
      'helpful',
      'dislike'
    )
  );

CREATE OR REPLACE FUNCTION public.is_valid_chat_message_reaction(p_reaction TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(p_reaction) IN (
    'heart',
    'thumbs_up',
    'blue_heart',
    'laugh',
    'wow',
    'pleading',
    'confirm',
    'helpful',
    'dislike'
  );
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

  IF NOT public.is_valid_chat_message_reaction(v_reaction) THEN
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

NOTIFY pgrst, 'reload schema';
