-- 채팅방 폐쇄 RPC (RLS 우회·관리자 전용)
-- migration_v17_ems_chat_rooms.sql 이후 실행

CREATE OR REPLACE FUNCTION public.admin_deactivate_ems_chat_room(p_room_id UUID)
RETURNS public.ems_chat_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ems_chat_rooms;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  UPDATE public.ems_chat_rooms
  SET is_active = false,
      closed_at = TIMEZONE('utc'::text, NOW()),
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_room_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'room_not_found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_deactivate_ems_chat_room(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
