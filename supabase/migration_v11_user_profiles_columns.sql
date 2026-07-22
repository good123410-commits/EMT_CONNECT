-- user_profiles 컬럼 보강 (v5만 적용된 DB 등 name 없음 오류 대응)
-- Supabase SQL Editor에서 실행

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS invitation_code TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;

NOTIFY pgrst, 'reload schema';
