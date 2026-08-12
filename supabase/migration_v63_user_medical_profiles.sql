-- 개인 의료정보(민감정보) — 사용자별 1행, RLS로 본인만 접근

CREATE TABLE IF NOT EXISTS public.user_medical_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chronic_conditions TEXT NOT NULL DEFAULT '',
  medications TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT '',
  emergency_contact_1_name TEXT NOT NULL DEFAULT '',
  emergency_contact_1_phone TEXT NOT NULL DEFAULT '',
  emergency_contact_2_name TEXT NOT NULL DEFAULT '',
  emergency_contact_2_phone TEXT NOT NULL DEFAULT '',
  medical_notes TEXT NOT NULL DEFAULT '',
  preferred_hospital TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_medical_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_medical_profiles_select_own" ON public.user_medical_profiles;
CREATE POLICY "user_medical_profiles_select_own"
  ON public.user_medical_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_medical_profiles_insert_own" ON public.user_medical_profiles;
CREATE POLICY "user_medical_profiles_insert_own"
  ON public.user_medical_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_medical_profiles_update_own" ON public.user_medical_profiles;
CREATE POLICY "user_medical_profiles_update_own"
  ON public.user_medical_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_medical_profiles_delete_own" ON public.user_medical_profiles;
CREATE POLICY "user_medical_profiles_delete_own"
  ON public.user_medical_profiles FOR DELETE
  USING (auth.uid() = user_id);
