-- 앱 전역 설정 (커피 후원 카카오페이 딥링크 등)
-- Supabase 대시보드 → Table Editor → settings 행만 수정하면 앱에 반영됩니다.

CREATE TABLE IF NOT EXISTS public.settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  kakaotalk_pay_link TEXT NOT NULL DEFAULT 'kakaotalk://kakaopay/money/send',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

INSERT INTO public.settings (id, kakaotalk_pay_link)
VALUES (1, 'kakaotalk://kakaopay/money/send')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read"
  ON public.settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "settings_admin_all" ON public.settings;
CREATE POLICY "settings_admin_all"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS public.settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.settings WHERE id = 1 LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_app_settings() TO anon, authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
