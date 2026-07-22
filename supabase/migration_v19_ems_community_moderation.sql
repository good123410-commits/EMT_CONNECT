-- EMS 커뮤니티 모더레이션 (블라인드/숨김)
-- migration_v18_admin_deactivate_chat_room.sql 이후 실행

ALTER TABLE public.ems_community_posts
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ems_community_posts_type_hidden_created
  ON public.ems_community_posts (post_type, is_hidden, created_at DESC);

-- 일반 사용자: 숨김 처리된 글은 조회 불가 (관리자 정책과 OR)
DROP POLICY IF EXISTS "ems_community_posts_public_read" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_public_read"
  ON public.ems_community_posts
  FOR SELECT
  USING (is_hidden = false);

-- 관리자: 블라인드/삭제 RPC
CREATE OR REPLACE FUNCTION public.admin_set_community_post_hidden(
  p_post_id UUID,
  p_hidden BOOLEAN
)
RETURNS public.ems_community_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ems_community_posts;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  UPDATE public.ems_community_posts
  SET is_hidden = p_hidden,
      hidden_at = CASE
        WHEN p_hidden THEN TIMEZONE('utc'::text, NOW())
        ELSE NULL
      END,
      hidden_by = CASE
        WHEN p_hidden THEN auth.uid()
        ELSE NULL
      END,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = p_post_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_community_post(p_post_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'not_authorized_admin';
  END IF;

  DELETE FROM public.ems_community_posts
  WHERE id = p_post_id
  RETURNING id INTO v_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_community_post_hidden(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_community_post(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
