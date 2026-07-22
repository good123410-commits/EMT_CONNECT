-- EMS 커뮤니티 동적 채팅방 (관리자 생성·폐쇄)
-- migration_v16_ems_community_resources.sql 이후 실행

CREATE TABLE IF NOT EXISTS public.ems_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL,
  region TEXT,
  category TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ems_chat_rooms_active_created
  ON public.ems_chat_rooms (is_active, created_at DESC);

ALTER TABLE public.ems_chat_rooms ENABLE ROW LEVEL SECURITY;

-- 활성 채팅방: 승인 구급대원·관리자 조회
DROP POLICY IF EXISTS "ems_chat_rooms_active_read" ON public.ems_chat_rooms;
CREATE POLICY "ems_chat_rooms_active_read"
  ON public.ems_chat_rooms
  FOR SELECT
  TO authenticated
  USING (is_active = true AND public.can_access_paramedic_community());

-- 관리자: 전체 채팅방 조회·관리
DROP POLICY IF EXISTS "ems_chat_rooms_admin_all" ON public.ems_chat_rooms;
CREATE POLICY "ems_chat_rooms_admin_all"
  ON public.ems_chat_rooms
  FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

-- 채팅 메시지 작성 시 활성 방인지 검증
CREATE OR REPLACE FUNCTION public.is_ems_chat_room_active(p_room_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ems_chat_rooms
    WHERE id::text = p_room_id
      AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_ems_chat_room_active(TEXT) TO authenticated;

DROP POLICY IF EXISTS "ems_community_posts_auth_insert" ON public.ems_community_posts;
CREATE POLICY "ems_community_posts_auth_insert"
  ON public.ems_community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_paramedic_community()
    AND post_type <> 'resource'
    AND (
      post_type <> 'chat'
      OR (
        room_id IS NOT NULL
        AND public.is_ems_chat_room_active(room_id)
      )
    )
  );

-- 기본 채팅방 시드 (최초 1회)
INSERT INTO public.ems_chat_rooms (room_name, region, category, description, is_active)
SELECT v.room_name, v.region, v.category, v.description, true
FROM (
  VALUES
    ('통합방', '전국', '통합', '전국 구급대원 자유 소통'),
    ('서울', '서울특별시', '지역', '수도권 현장 정보'),
    ('경기', '경기도', '지역', '경기권 거점 소통'),
    ('부산', '부산광역시', '지역', '영남권 현장 정보'),
    ('기타', '기타', '지역', '그 외 지역')
) AS v(room_name, region, category, description)
WHERE NOT EXISTS (SELECT 1 FROM public.ems_chat_rooms LIMIT 1);

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ems_chat_rooms;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
