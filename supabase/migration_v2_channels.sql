-- EMT Connect V2: 4대 채널 분리형 회원 체계 + 히든 게시판 + 사설 구급차 호출
-- Supabase Dashboard > SQL Editor 에서 실행하세요.

-- ============================================================
-- 1. user_profiles (기존 profiles 대체)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'hospital', 'paramedic', 'private_ems')),
    name TEXT,
    company_name TEXT,
    invitation_code TEXT,
    is_approved BOOLEAN DEFAULT false,
    wallet_balance NUMERIC DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 기존 profiles 데이터 마이그레이션 (있을 경우)
INSERT INTO user_profiles (id, email, role, name, invitation_code, is_approved, wallet_balance, created_at)
SELECT
    p.id,
    u.email,
    CASE p.role
        WHEN 'public' THEN 'user'
        WHEN 'emt_certified' THEN 'paramedic'
        ELSE 'user'
    END,
    p.name,
    p.invitation_code_used,
    p.is_approved,
    p.wallet_balance,
    p.created_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. hidden_posts (4대 히든 채널 게시판)
-- ============================================================
CREATE TABLE IF NOT EXISTS hidden_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    target_role TEXT NOT NULL CHECK (target_role IN ('all', 'hospital', 'paramedic', 'private_ems', 'nurse')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_hidden_posts_target_role ON hidden_posts(target_role);
CREATE INDEX IF NOT EXISTS idx_hidden_posts_created_at ON hidden_posts(created_at DESC);

-- ============================================================
-- 3. private_ems_calls (사설 구급차 호출 V1.5)
-- ============================================================
CREATE TABLE IF NOT EXISTS private_ems_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    address TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    assigned_operator_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_private_ems_calls_status ON private_ems_calls(status);
CREATE INDEX IF NOT EXISTS idx_private_ems_calls_created_at ON private_ems_calls(created_at DESC);

-- ============================================================
-- 4. 신규 가입 트리거 (user_profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, is_approved, wallet_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL),
    'user',
    false,
    0.00
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
CREATE TRIGGER on_auth_user_created_v2
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_v2();

-- ============================================================
-- 5. RLS 활성화
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_ems_calls ENABLE ROW LEVEL SECURITY;

-- user_profiles: 본인 읽기, role/is_approved는 직접 수정 불가 (일반 필드만)
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    AND is_approved = (SELECT is_approved FROM user_profiles WHERE id = auth.uid())
  );

-- hidden_posts: 승인된 전문가만, 본인 역할 채널만 접근
DROP POLICY IF EXISTS "hidden_posts_select" ON hidden_posts;
CREATE POLICY "hidden_posts_select" ON hidden_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_approved = true
        AND up.role IN ('hospital', 'paramedic', 'private_ems')
        AND (
          (up.role = 'paramedic' AND hidden_posts.target_role IN ('all', 'paramedic'))
          OR (up.role = 'hospital' AND hidden_posts.target_role IN ('all', 'hospital'))
          OR (up.role = 'private_ems' AND hidden_posts.target_role IN ('all', 'private_ems'))
        )
    )
  );

DROP POLICY IF EXISTS "hidden_posts_insert" ON hidden_posts;
CREATE POLICY "hidden_posts_insert" ON hidden_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_approved = true
        AND up.role IN ('hospital', 'paramedic', 'private_ems')
        AND (
          (up.role = 'paramedic' AND hidden_posts.target_role IN ('all', 'paramedic'))
          OR (up.role = 'hospital' AND hidden_posts.target_role IN ('all', 'hospital'))
          OR (up.role = 'private_ems' AND hidden_posts.target_role IN ('all', 'private_ems'))
        )
    )
  );

-- private_ems_calls: 일반 유저 호출 생성, 운용자는 전체 조회/상태 변경
DROP POLICY IF EXISTS "ems_calls_insert_requester" ON private_ems_calls;
CREATE POLICY "ems_calls_insert_requester" ON private_ems_calls
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'user'
    )
  );

DROP POLICY IF EXISTS "ems_calls_select_own" ON private_ems_calls;
CREATE POLICY "ems_calls_select_own" ON private_ems_calls
  FOR SELECT USING (
    auth.uid() = requester_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'private_ems'
        AND up.is_approved = true
    )
  );

DROP POLICY IF EXISTS "ems_calls_update_operator" ON private_ems_calls;
CREATE POLICY "ems_calls_update_operator" ON private_ems_calls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'private_ems'
        AND up.is_approved = true
    )
  );

-- emt_verifications FK를 user_profiles로 연결 (기존 profiles 참조 대체)
ALTER TABLE emt_verifications DROP CONSTRAINT IF EXISTS emt_verifications_user_id_fkey;
ALTER TABLE emt_verifications
  ADD CONSTRAINT emt_verifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Realtime 활성화 (Dashboard > Database > Replication 에서도 확인)
-- 이미 추가된 경우 오류 무시
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE private_ems_calls;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
