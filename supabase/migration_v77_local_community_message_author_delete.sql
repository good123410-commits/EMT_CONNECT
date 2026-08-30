-- 우리동네토크 채팅: 작성자 본인 메시지 숨김(삭제) 권한
-- migration_v76_user_blocks.sql 이후 SQL Editor에서 실행

DROP POLICY IF EXISTS "local_community_messages_author_blind_own" ON public.local_community_messages;
CREATE POLICY "local_community_messages_author_blind_own"
  ON public.local_community_messages
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() AND is_blinded = false)
  WITH CHECK (author_id = auth.uid() AND is_blinded = true);

NOTIFY pgrst, 'reload schema';
