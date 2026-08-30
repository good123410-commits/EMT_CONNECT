-- 유저 차단 + 채팅/피드 작성자 삭제 권한 — migration_v75 이후 실행

CREATE TABLE IF NOT EXISTS public.kemix_user_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  PRIMARY KEY (blocker_id, blocked_user_id),
  CHECK (blocker_id <> blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_kemix_user_blocks_blocker
  ON public.kemix_user_blocks (blocker_id, created_at DESC);

ALTER TABLE public.kemix_user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kemix_user_blocks_select_own" ON public.kemix_user_blocks;
CREATE POLICY "kemix_user_blocks_select_own"
  ON public.kemix_user_blocks
  FOR SELECT
  TO authenticated
  USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "kemix_user_blocks_insert_own" ON public.kemix_user_blocks;
CREATE POLICY "kemix_user_blocks_insert_own"
  ON public.kemix_user_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "kemix_user_blocks_delete_own" ON public.kemix_user_blocks;
CREATE POLICY "kemix_user_blocks_delete_own"
  ON public.kemix_user_blocks
  FOR DELETE
  TO authenticated
  USING (blocker_id = auth.uid());

CREATE OR REPLACE FUNCTION public.block_user(
  p_blocked_user_id UUID,
  p_blocked_label TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_blocked_user_id IS NULL OR p_blocked_user_id = v_uid THEN
    RAISE EXCEPTION 'invalid_blocked_user';
  END IF;

  INSERT INTO public.kemix_user_blocks (blocker_id, blocked_user_id, blocked_label)
  VALUES (v_uid, p_blocked_user_id, NULLIF(TRIM(p_blocked_label), ''))
  ON CONFLICT (blocker_id, blocked_user_id)
  DO UPDATE SET
    blocked_label = COALESCE(EXCLUDED.blocked_label, public.kemix_user_blocks.blocked_label),
    created_at = TIMEZONE('utc'::text, NOW());
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_user(p_blocked_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  DELETE FROM public.kemix_user_blocks
  WHERE blocker_id = v_uid
    AND blocked_user_id = p_blocked_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_blocked_users()
RETURNS TABLE (
  blocked_user_id UUID,
  blocked_label TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.blocked_user_id, b.blocked_label, b.created_at
  FROM public.kemix_user_blocks b
  WHERE b.blocker_id = auth.uid()
  ORDER BY b.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.delete_local_community_message(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.local_community_messages;
BEGIN
  SELECT * INTO v_row
  FROM public.local_community_messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'message_not_found';
  END IF;

  IF NOT (
    public.is_approved_admin()
    OR (auth.uid() IS NOT NULL AND v_row.author_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.local_community_messages
  SET is_blinded = true
  WHERE id = p_message_id;

  PERFORM public.refresh_local_community_room_stats(v_row.room_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_local_community_post(p_post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.local_community_posts;
BEGIN
  SELECT * INTO v_row
  FROM public.local_community_posts
  WHERE id = p_post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  IF NOT (
    public.is_approved_admin()
    OR (auth.uid() IS NOT NULL AND v_row.author_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.local_community_posts
  SET is_blinded = true
  WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.block_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_blocked_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_local_community_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_local_community_post(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
