-- 유저별 푸시 알림 설정 (게시글/댓글/채팅 개별 ON·OFF)

CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled_posts BOOLEAN NOT NULL DEFAULT true,
  push_enabled_comments BOOLEAN NOT NULL DEFAULT true,
  push_enabled_chats BOOLEAN NOT NULL DEFAULT true,
  expo_push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, NOW())
);

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_notification_settings_select_own" ON public.user_notification_settings;
CREATE POLICY "user_notification_settings_select_own"
  ON public.user_notification_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_notification_settings_insert_own" ON public.user_notification_settings;
CREATE POLICY "user_notification_settings_insert_own"
  ON public.user_notification_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_notification_settings_update_own" ON public.user_notification_settings;
CREATE POLICY "user_notification_settings_update_own"
  ON public.user_notification_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_my_notification_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.user_notification_settings;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_row FROM public.user_notification_settings WHERE user_id = v_uid;
  IF NOT FOUND THEN
    INSERT INTO public.user_notification_settings (user_id)
    VALUES (v_uid)
    RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'push_enabled_posts', v_row.push_enabled_posts,
    'push_enabled_comments', v_row.push_enabled_comments,
    'push_enabled_chats', v_row.push_enabled_chats,
    'expo_push_token', v_row.expo_push_token
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_my_notification_settings(
  p_push_enabled_posts BOOLEAN DEFAULT NULL,
  p_push_enabled_comments BOOLEAN DEFAULT NULL,
  p_push_enabled_chats BOOLEAN DEFAULT NULL,
  p_expo_push_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.user_notification_settings;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.user_notification_settings (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_notification_settings
  SET
    push_enabled_posts = COALESCE(p_push_enabled_posts, push_enabled_posts),
    push_enabled_comments = COALESCE(p_push_enabled_comments, push_enabled_comments),
    push_enabled_chats = COALESCE(p_push_enabled_chats, push_enabled_chats),
    expo_push_token = COALESCE(NULLIF(TRIM(p_expo_push_token), ''), expo_push_token),
    updated_at = timezone('utc'::text, NOW())
  WHERE user_id = v_uid
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'push_enabled_posts', v_row.push_enabled_posts,
    'push_enabled_comments', v_row.push_enabled_comments,
    'push_enabled_chats', v_row.push_enabled_chats,
    'expo_push_token', v_row.expo_push_token
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_notification_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_my_notification_settings(BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

-- 게시글 작성자가 자신의 글에 달린 좋아요 Realtime 이벤트를 수신할 수 있도록
DROP POLICY IF EXISTS "ems_post_reactions_author_read" ON public.ems_community_post_reactions;
CREATE POLICY "ems_post_reactions_author_read"
  ON public.ems_community_post_reactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ems_community_posts p
      WHERE p.id = post_id AND p.author_id = auth.uid()
    )
  );

-- Realtime (설정 변경 시 다른 기기 동기화용 — 선택)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification_settings;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.ems_community_post_reactions;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
