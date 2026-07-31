-- 우리동네 실시간 톡: Supabase 백엔드 + Realtime + 24h TTL
-- 선행: migration_v53_ems_auth_status.sql

CREATE TABLE IF NOT EXISTS public.local_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('pediatric_wait', 'night_clinic', 'emergency_parenting')
  ),
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  anonymous_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (
    TIMEZONE('utc'::text, NOW()) + INTERVAL '24 hours'
  ),
  report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  is_blinded BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_local_community_posts_region_created
  ON public.local_community_posts (region_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_local_community_posts_region_expires
  ON public.local_community_posts (region_code, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_local_community_posts_expires
  ON public.local_community_posts (expires_at);

ALTER TABLE public.local_community_posts ENABLE ROW LEVEL SECURITY;

-- 활성(미만료·미블라인드) 글만 공개 조회
DROP POLICY IF EXISTS "local_community_posts_public_read" ON public.local_community_posts;
CREATE POLICY "local_community_posts_public_read"
  ON public.local_community_posts
  FOR SELECT
  USING (
    expires_at > TIMEZONE('utc'::text, NOW())
    AND is_blinded = false
  );

-- 익명·회원 모두 작성 가능 (로그인 불필요 기능 유지)
DROP POLICY IF EXISTS "local_community_posts_public_insert" ON public.local_community_posts;
CREATE POLICY "local_community_posts_public_insert"
  ON public.local_community_posts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(content) >= 1
    AND char_length(content) <= 500
    AND region_code IS NOT NULL
    AND anonymous_label IS NOT NULL
  );

DROP POLICY IF EXISTS "local_community_posts_admin_all" ON public.local_community_posts;
CREATE POLICY "local_community_posts_admin_all"
  ON public.local_community_posts
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 신고 RPC (중복 신고 방지는 클라이언트 + 선택적 reporter 테이블)
CREATE OR REPLACE FUNCTION public.report_local_community_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.local_community_posts;
  v_blinded BOOLEAN;
BEGIN
  UPDATE public.local_community_posts
  SET report_count = report_count + 1,
      is_blinded = CASE
        WHEN report_count + 1 >= 3 THEN true
        ELSE is_blinded
      END
  WHERE id = p_post_id
    AND expires_at > TIMEZONE('utc'::text, NOW())
    AND is_blinded = false
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found_or_hidden';
  END IF;

  v_blinded := v_row.is_blinded;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'report_count', v_row.report_count,
    'is_blinded', v_blinded,
    'blinded', v_blinded
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.report_local_community_post(UUID) TO anon, authenticated;

-- 만료 글 정리 (pg_cron 또는 수동 호출용)
CREATE OR REPLACE FUNCTION public.purge_expired_local_community_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.local_community_posts
  WHERE expires_at <= TIMEZONE('utc'::text, NOW());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_expired_local_community_posts() TO authenticated;

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.local_community_posts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
