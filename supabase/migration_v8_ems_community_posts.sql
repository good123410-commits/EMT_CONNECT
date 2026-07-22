-- EMS 커뮤니티 유저 게시글 (대나무숲 · 케이스 · 채팅 · 구직)
-- migration_v5(is_approved_admin) 이후 실행

CREATE TABLE IF NOT EXISTS public.ems_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type TEXT NOT NULL CHECK (post_type IN ('bamboo', 'case_study', 'chat', 'job_seek')),
  title TEXT,
  summary TEXT,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  room_id TEXT,
  region TEXT,
  anonymous_label TEXT NOT NULL DEFAULT '익명',
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
  is_hot BOOLEAN NOT NULL DEFAULT false,
  job_location TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_ems_community_posts_type_created
  ON public.ems_community_posts (post_type, created_at DESC);

ALTER TABLE public.ems_community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ems_community_posts_public_read" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_public_read"
  ON public.ems_community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "ems_community_posts_auth_insert" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_auth_insert"
  ON public.ems_community_posts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ems_community_posts_auth_update_own" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_auth_update_own"
  ON public.ems_community_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "ems_community_posts_admin_all" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_admin_all"
  ON public.ems_community_posts FOR ALL
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

NOTIFY pgrst, 'reload schema';
