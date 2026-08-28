-- 댓글 작성자 수정/삭제 + 관리자 삭제
-- 선행: migration_v42_kemix_community_board_enhance.sql

DROP POLICY IF EXISTS "ems_comments_author_update" ON public.ems_community_comments;
CREATE POLICY "ems_comments_author_update"
  ON public.ems_community_comments
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "ems_comments_author_delete" ON public.ems_community_comments;
CREATE POLICY "ems_comments_author_delete"
  ON public.ems_community_comments
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS "ems_comments_admin_delete" ON public.ems_community_comments;
CREATE POLICY "ems_comments_admin_delete"
  ON public.ems_community_comments
  FOR DELETE
  TO authenticated
  USING (public.is_approved_admin());

NOTIFY pgrst, 'reload schema';
