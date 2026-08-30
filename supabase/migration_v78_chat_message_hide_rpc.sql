-- 채팅 메시지 숨김(삭제) RPC — 클라이언트 UPDATE + RETURNING RLS 오탐 방지
-- migration_v77_local_community_message_author_delete.sql 이후 실행

CREATE OR REPLACE FUNCTION public.hide_ems_chat_message(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ems_community_posts;
BEGIN
  SELECT * INTO v_row
  FROM public.ems_community_posts
  WHERE id = p_message_id
    AND post_type = 'chat';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'message_not_found';
  END IF;

  IF NOT (
    public.is_approved_admin()
    OR (auth.uid() IS NOT NULL AND v_row.author_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.ems_community_posts
  SET
    is_hidden = true,
    hidden_at = TIMEZONE('utc'::text, NOW()),
    hidden_by = auth.uid(),
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_message_id
    AND post_type = 'chat';
END;
$$;

GRANT EXECUTE ON FUNCTION public.hide_ems_chat_message(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
