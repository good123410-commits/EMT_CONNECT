-- EMS_Connect Supabase Schema
-- Supabase Dashboard > SQL Editor 에서 실행하세요.

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'public' CHECK (role IN ('public', 'emt_certified')),
    is_approved BOOLEAN DEFAULT false,
    invitation_code_used TEXT,
    wallet_balance NUMERIC DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. emt_verifications
CREATE TABLE IF NOT EXISTS emt_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. point_transactions
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('ad_reward', 'survey_payout', 'group_buy_purchase', 'cash_out')),
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. surveys (README 확장용)
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    total_budget NUMERIC NOT NULL,
    participant_count INTEGER DEFAULT 0,
    max_participants INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. group_buys (README 확장용)
CREATE TABLE IF NOT EXISTS group_buys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    original_price NUMERIC,
    discount_price NUMERIC NOT NULL,
    min_threshold INTEGER NOT NULL,
    current_orders INTEGER DEFAULT 0,
    status TEXT DEFAULT 'verifying' CHECK (status IN ('verifying', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 신규 가입 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, is_approved, wallet_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL),
    'public',
    false,
    0.00
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emt_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- profiles: 본인만 읽기/수정 (role 변경은 서비스 롤 또는 트리거)
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- emt_verifications: 본인만 insert/select
CREATE POLICY "verifications_select_own" ON emt_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "verifications_insert_own" ON emt_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "verifications_update_own" ON emt_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage: verifications 버킷 (Dashboard > Storage 에서 버킷 생성 후 정책 적용)
-- 버킷명: verifications (private 권장)
-- 아래는 authenticated 사용자가 본인 폴더에 업로드/읽기 허용 예시:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('verifications', 'verifications', false)
-- ON CONFLICT DO NOTHING;

-- CREATE POLICY "verifications_upload_own" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "verifications_read_own" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text);
