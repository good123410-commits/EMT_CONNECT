-- EMS 커뮤니티(케이스·소통창·구인구직) 스키마 보강 + Realtime + RLS
-- migration_v8_ems_community_posts.sql 이후 실행

CREATE OR REPLACE FUNCTION public.can_access_paramedic_community()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_approved_paramedic() OR public.is_approved_admin();
$$;

GRANT EXECUTE ON FUNCTION public.can_access_paramedic_community() TO authenticated;

ALTER TABLE public.ems_community_posts
  DROP CONSTRAINT IF EXISTS ems_community_posts_post_type_check;

ALTER TABLE public.ems_community_posts
  ADD CONSTRAINT ems_community_posts_post_type_check
  CHECK (post_type IN ('bamboo', 'case_study', 'chat', 'job_seek', 'job_hire'));

ALTER TABLE public.ems_community_posts
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS salary TEXT,
  ADD COLUMN IF NOT EXISTS schedule TEXT,
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ems_community_posts_room_created
  ON public.ems_community_posts (post_type, room_id, created_at DESC);

-- 승인 구급대원·관리자만 글 작성
DROP POLICY IF EXISTS "ems_community_posts_auth_insert" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_auth_insert"
  ON public.ems_community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_paramedic_community());

-- 좋아요 증가 RPC (작성자 외에도 허용)
CREATE OR REPLACE FUNCTION public.increment_ems_community_likes(p_post_id UUID)
RETURNS public.ems_community_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ems_community_posts;
BEGIN
  IF NOT public.can_access_paramedic_community() THEN
    RAISE EXCEPTION 'not_authorized_community';
  END IF;

  UPDATE public.ems_community_posts
  SET likes = likes + 1,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_post_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ems_community_likes(UUID) TO authenticated;

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ems_community_posts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
