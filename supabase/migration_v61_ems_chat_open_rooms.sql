-- EMS 소통창: 오픈채팅 스타일 (방 목록 통계 + 회원 개설)
-- 선행: migration_v17_ems_chat_rooms.sql

ALTER TABLE public.ems_chat_rooms
  ADD COLUMN IF NOT EXISTS creator_label TEXT,
  ADD COLUMN IF NOT EXISTS message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
  ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 0 CHECK (participant_count >= 0),
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

UPDATE public.ems_chat_rooms
SET creator_label = COALESCE(creator_label, '관리자')
WHERE creator_label IS NULL;

CREATE INDEX IF NOT EXISTS idx_ems_chat_rooms_activity
  ON public.ems_chat_rooms (is_active, last_message_at DESC NULLS LAST, created_at DESC);

-- 승인 구급대원·관리자: 채팅방 개설
DROP POLICY IF EXISTS "ems_chat_rooms_community_insert" ON public.ems_chat_rooms;
CREATE POLICY "ems_chat_rooms_community_insert"
  ON public.ems_chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_paramedic_community()
    AND char_length(room_name) >= 2
    AND is_active = true
  );

CREATE OR REPLACE FUNCTION public.refresh_ems_chat_room_stats(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preview TEXT;
  v_last_at TIMESTAMPTZ;
  v_msg_count INTEGER;
  v_participant_count INTEGER;
BEGIN
  SELECT
    LEFT(p.content, 100),
    p.created_at
  INTO v_preview, v_last_at
  FROM public.ems_community_posts p
  WHERE p.room_id = p_room_id::text
    AND p.post_type = 'chat'
    AND p.is_hidden = false
  ORDER BY p.created_at DESC
  LIMIT 1;

  SELECT COUNT(*)::INTEGER
  INTO v_msg_count
  FROM public.ems_community_posts p
  WHERE p.room_id = p_room_id::text
    AND p.post_type = 'chat'
    AND p.is_hidden = false;

  SELECT COUNT(DISTINCT COALESCE(p.author_id::text, p.anonymous_label))::INTEGER
  INTO v_participant_count
  FROM public.ems_community_posts p
  WHERE p.room_id = p_room_id::text
    AND p.post_type = 'chat'
    AND p.is_hidden = false;

  UPDATE public.ems_chat_rooms
  SET
    message_count = COALESCE(v_msg_count, 0),
    participant_count = COALESCE(v_participant_count, 0),
    last_message_preview = v_preview,
    last_message_at = v_last_at,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_room_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_ems_chat_post_room_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.post_type = 'chat' AND NEW.room_id IS NOT NULL THEN
    PERFORM public.refresh_ems_chat_room_stats(NEW.room_id::uuid);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ems_chat_post_after_insert ON public.ems_community_posts;
CREATE TRIGGER trg_ems_chat_post_after_insert
  AFTER INSERT ON public.ems_community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ems_chat_post_room_stats();

-- 기존 채팅 메시지로 통계 백필
DO $$
DECLARE
  v_room_id UUID;
BEGIN
  FOR v_room_id IN SELECT id FROM public.ems_chat_rooms LOOP
    PERFORM public.refresh_ems_chat_room_stats(v_room_id);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
