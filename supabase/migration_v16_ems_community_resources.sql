-- EMS 커뮤니티 자료실 (resource) post_type 추가 + 관리자 전용 작성/수정
-- migration_v14_ems_community_enhance.sql 이후 실행

ALTER TABLE public.ems_community_posts
  DROP CONSTRAINT IF EXISTS ems_community_posts_post_type_check;

ALTER TABLE public.ems_community_posts
  ADD CONSTRAINT ems_community_posts_post_type_check
  CHECK (post_type IN ('bamboo', 'case_study', 'chat', 'job_seek', 'job_hire', 'resource'));

-- 일반 구급대원: resource 제외하고 작성
DROP POLICY IF EXISTS "ems_community_posts_auth_insert" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_auth_insert"
  ON public.ems_community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_paramedic_community()
    AND post_type <> 'resource'
  );

DROP POLICY IF EXISTS "ems_community_posts_admin_resource_insert" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_admin_resource_insert"
  ON public.ems_community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    post_type = 'resource'
    AND public.is_approved_admin()
  );

-- resource는 작성자 본인 수정 불가 (관리자 정책으로만 수정)
DROP POLICY IF EXISTS "ems_community_posts_auth_update_own" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_auth_update_own"
  ON public.ems_community_posts
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() AND post_type <> 'resource')
  WITH CHECK (author_id = auth.uid() AND post_type <> 'resource');

NOTIFY pgrst, 'reload schema';
