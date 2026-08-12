-- 우리동네토크: 게시판 → 실시간 채팅방 (rooms + messages)
-- 선행: migration_v54_local_community_realtime.sql

CREATE TABLE IF NOT EXISTS public.local_community_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 60),
  topic TEXT CHECK (topic IS NULL OR char_length(topic) <= 40),
  category TEXT CHECK (
    category IS NULL
    OR category IN ('pediatric_wait', 'night_clinic', 'emergency_parenting')
  ),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 200),
  creator_label TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
  participant_count INTEGER NOT NULL DEFAULT 0 CHECK (participant_count >= 0),
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_local_community_rooms_region_activity
  ON public.local_community_rooms (region_code, is_active, last_message_at DESC NULLS LAST, created_at DESC);

CREATE TABLE IF NOT EXISTS public.local_community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.local_community_rooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  anonymous_label TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  is_blinded BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_local_community_messages_room_created
  ON public.local_community_messages (room_id, created_at ASC);

ALTER TABLE public.local_community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_community_messages ENABLE ROW LEVEL SECURITY;

-- 활성 채팅방 공개 조회
DROP POLICY IF EXISTS "local_community_rooms_public_read" ON public.local_community_rooms;
CREATE POLICY "local_community_rooms_public_read"
  ON public.local_community_rooms
  FOR SELECT
  USING (is_active = true);

-- 익명·회원 모두 채팅방 개설 가능
DROP POLICY IF EXISTS "local_community_rooms_public_insert" ON public.local_community_rooms;
CREATE POLICY "local_community_rooms_public_insert"
  ON public.local_community_rooms
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(title) >= 2
    AND char_length(title) <= 60
    AND region_code IS NOT NULL
    AND creator_label IS NOT NULL
    AND is_active = true
  );

DROP POLICY IF EXISTS "local_community_rooms_admin_all" ON public.local_community_rooms;
CREATE POLICY "local_community_rooms_admin_all"
  ON public.local_community_rooms
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 비블라인드 메시지 조회 (활성 방만)
DROP POLICY IF EXISTS "local_community_messages_public_read" ON public.local_community_messages;
CREATE POLICY "local_community_messages_public_read"
  ON public.local_community_messages
  FOR SELECT
  USING (
    is_blinded = false
    AND EXISTS (
      SELECT 1
      FROM public.local_community_rooms r
      WHERE r.id = room_id
        AND r.is_active = true
    )
  );

DROP POLICY IF EXISTS "local_community_messages_public_insert" ON public.local_community_messages;
CREATE POLICY "local_community_messages_public_insert"
  ON public.local_community_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(content) >= 1
    AND char_length(content) <= 500
    AND anonymous_label IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.local_community_rooms r
      WHERE r.id = room_id
        AND r.is_active = true
    )
  );

DROP POLICY IF EXISTS "local_community_messages_admin_all" ON public.local_community_messages;
CREATE POLICY "local_community_messages_admin_all"
  ON public.local_community_messages
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

CREATE OR REPLACE FUNCTION public.refresh_local_community_room_stats(p_room_id UUID)
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
    LEFT(m.content, 100),
    m.created_at
  INTO v_preview, v_last_at
  FROM public.local_community_messages m
  WHERE m.room_id = p_room_id
    AND m.is_blinded = false
  ORDER BY m.created_at DESC
  LIMIT 1;

  SELECT COUNT(*)::INTEGER
  INTO v_msg_count
  FROM public.local_community_messages m
  WHERE m.room_id = p_room_id
    AND m.is_blinded = false;

  SELECT COUNT(DISTINCT COALESCE(m.author_id::text, m.anonymous_label))::INTEGER
  INTO v_participant_count
  FROM public.local_community_messages m
  WHERE m.room_id = p_room_id
    AND m.is_blinded = false;

  UPDATE public.local_community_rooms
  SET
    message_count = COALESCE(v_msg_count, 0),
    participant_count = COALESCE(v_participant_count, 0),
    last_message_preview = v_preview,
    last_message_at = v_last_at,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_room_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_local_community_message_room_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_local_community_room_stats(NEW.room_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_local_community_message_after_insert ON public.local_community_messages;
CREATE TRIGGER trg_local_community_message_after_insert
  AFTER INSERT ON public.local_community_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_local_community_message_room_stats();

CREATE OR REPLACE FUNCTION public.report_local_community_message(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.local_community_messages;
BEGIN
  UPDATE public.local_community_messages
  SET report_count = report_count + 1,
      is_blinded = CASE
        WHEN report_count + 1 >= 3 THEN true
        ELSE is_blinded
      END
  WHERE id = p_message_id
    AND is_blinded = false
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'message_not_found_or_hidden';
  END IF;

  IF v_row.is_blinded THEN
    PERFORM public.refresh_local_community_room_stats(v_row.room_id);
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'report_count', v_row.report_count,
    'is_blinded', v_row.is_blinded,
    'blinded', v_row.is_blinded
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.report_local_community_message(UUID) TO anon, authenticated;

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.local_community_rooms;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.local_community_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
